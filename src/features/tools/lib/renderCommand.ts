import { type Command, type CommandContext, defineCommand, type ExecResult } from "just-bash/browser";
import { getConfig } from "@/shared/config";
import { inferContentTypeFromPath } from "@/shared/lib/fileTypes";
import { getFileName } from "@/shared/lib/utils";
import { parseFlags, resolveModel, resolvePath, writeOutputFile } from "./commandUtils";
import type { RenderInput } from "./interpreterProtocol";

const RENDER_FLAGS = { "-i": "input", "--input": "input", "-o": "output", "--output": "output" };
const RENDER_USAGE = 'usage: render [-i input.png ...] -o output.png "prompt"';

export async function runRenderImage(prompt: string, inputs: RenderInput[]): Promise<Uint8Array> {
  const config = getConfig();
  if (!config.renderer) {
    throw new Error("render: no image rendering service configured");
  }
  if (!prompt.trim()) {
    throw new Error("render: no prompt provided");
  }

  // Ship original filenames and content types — the backend routes uploads
  // by content type, like the extractor does for `ocr`.
  const images = inputs.map(({ data, path }) => {
    if (data.length === 0) {
      throw new Error(`render: file is empty: ${path}`);
    }
    const name = getFileName(path);
    const type = inferContentTypeFromPath(name);
    if (!type?.startsWith("image/")) {
      throw new Error(`render: not an image: ${name} — use a known image extension like .png or .jpg`);
    }
    return new File([data as BlobPart], name, { type });
  });

  const model = await resolveModel(config.renderer.model, "renderer");
  const blob = await config.client.generateImage(model, prompt, images);
  const data = new Uint8Array(await blob.arrayBuffer());
  if (data.length === 0) {
    throw new Error("render: service returned an empty image");
  }
  console.debug(`render: ${inputs.length} input image(s) → ${data.length} bytes (${blob.type || "unknown type"})`);
  return data;
}

async function executeRender(args: string[], ctx: CommandContext): Promise<ExecResult> {
  const { options, rest, error } = parseFlags("render", args, RENDER_FLAGS);
  if (error) {
    return { stdout: "", stderr: `${error}\n`, exitCode: 2 };
  }

  const output = options.output?.at(-1);
  const prompt = rest.join(" ").trim();
  if (!output || !prompt) {
    return { stdout: "", stderr: `${RENDER_USAGE}\n`, exitCode: 2 };
  }

  const images: RenderInput[] = [];
  for (const input of options.input ?? []) {
    const fsPath = resolvePath(input, ctx.cwd);
    try {
      // readFileBuffer, not readFile — the latter decodes to a UTF-8 string,
      // which destroys binary image data.
      images.push({ data: await ctx.fs.readFileBuffer(fsPath), path: fsPath });
    } catch {
      return { stdout: "", stderr: `render: cannot read file: ${input}\n`, exitCode: 1 };
    }
  }

  try {
    const data = await runRenderImage(prompt, images);
    await writeOutputFile(ctx.fs, resolvePath(output, ctx.cwd), data);
    return { stdout: "", stderr: "", exitCode: 0 };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { stdout: "", stderr: `${message}\n`, exitCode: 1 };
  }
}

export const renderCommands: Command[] = [defineCommand("render", executeRender)];
