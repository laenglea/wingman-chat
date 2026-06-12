import { type Command, type CommandContext, defineCommand, type ExecResult } from "just-bash/browser";
import { getConfig } from "@/shared/config";
import { inferContentTypeFromPath } from "@/shared/lib/fileTypes";
import { getFileName } from "@/shared/lib/utils";
import { resolvePath, writeOutputFile } from "./commandUtils";
import type { RenderImageInput } from "./interpreterProtocol";

export async function runRenderImage(prompt: string, inputs: RenderImageInput[]): Promise<Uint8Array> {
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

  const blob = await config.client.generateImage(config.renderer.model ?? "", prompt, images);
  const data = new Uint8Array(await blob.arrayBuffer());
  if (data.length === 0) {
    throw new Error("render: service returned an empty image");
  }
  console.debug(`render: ${inputs.length} input image(s) → ${data.length} bytes (${blob.type || "unknown type"})`);
  return data;
}

function parseRenderArgs(args: string[]): { inputs: string[]; output: string; prompt: string; error?: string } {
  const inputs: string[] = [];
  let output: string | undefined;
  const rest: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-i" || arg === "--input") {
      const value = args[++i];
      if (!value) return { inputs, output: "", prompt: "", error: `render: option ${arg} requires an argument` };
      inputs.push(value);
    } else if (arg === "-o" || arg === "--output") {
      const value = args[++i];
      if (!value) return { inputs, output: "", prompt: "", error: `render: option ${arg} requires an argument` };
      output = value;
    } else {
      rest.push(arg);
    }
  }

  const prompt = rest.join(" ").trim();
  if (!output || !prompt) {
    return { inputs, output: "", prompt: "", error: 'usage: render [-i input.png ...] -o output.png "prompt"' };
  }

  return { inputs, output, prompt };
}

async function executeRender(args: string[], ctx: CommandContext): Promise<ExecResult> {
  const { inputs, output, prompt, error } = parseRenderArgs(args);
  if (error) {
    return { stdout: "", stderr: `${error}\n`, exitCode: 2 };
  }

  const images: RenderImageInput[] = [];
  for (const input of inputs) {
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
