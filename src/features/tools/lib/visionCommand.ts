import { type Command, type CommandContext, defineCommand, type ExecResult } from "just-bash/browser";
import { getConfig } from "@/shared/config";
import { bytesToDataUrl } from "@/shared/lib/fileContent";
import { inferContentTypeFromPath } from "@/shared/lib/fileTypes";
import { getFileName } from "@/shared/lib/utils";
import { getTextFromContent, Role } from "@/shared/types/chat";
import { resolvePath, writeOutputFile } from "./commandUtils";
import { getModel } from "./llmCommand";

const DEFAULT_PROMPT =
  "Transcribe all text in this image verbatim, preserving the layout where possible. " +
  "If the image contains no text, describe its content in detail instead.";

export async function runVision(bytes: Uint8Array, path: string, prompt?: string): Promise<string> {
  const config = getConfig();
  if (!config.vision) {
    throw new Error("vision: no vision service configured");
  }
  const model = config.vision.model || getModel();
  if (!model) {
    throw new Error("vision: no model");
  }
  if (bytes.length === 0) {
    throw new Error(`vision: file is empty: ${path}`);
  }

  const name = getFileName(path);
  const type = inferContentTypeFromPath(name);
  if (!type?.startsWith("image/")) {
    throw new Error(`vision: not an image: ${name} — use a known image extension like .png or .jpg`);
  }
  if (config.vision.files.length > 0 && !config.vision.files.includes(type)) {
    throw new Error(`vision: unsupported image type ${type} — supported: ${config.vision.files.join(", ")}`);
  }

  const result = await config.client.complete(
    model,
    "",
    [
      {
        role: Role.User,
        content: [
          { type: "image", name, data: bytesToDataUrl(bytes, type) },
          { type: "text", text: prompt?.trim() || DEFAULT_PROMPT },
        ],
      },
    ],
    [],
  );
  const text = getTextFromContent(result.content);
  console.debug(`vision: ${path} (${type}, ${bytes.length} bytes) → ${text.length} chars`);
  return text;
}

function parseVisionArgs(args: string[]): { output?: string; path: string; prompt?: string; error?: string } {
  let output: string | undefined;
  const rest: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-o" || arg === "--output") {
      const value = args[++i];
      if (!value) return { path: "", error: `vision: option ${arg} requires an argument` };
      output = value;
    } else {
      rest.push(arg);
    }
  }

  if (rest.length === 0) {
    return { path: "", error: 'usage: vision [-o output.txt] <image> ["prompt"]' };
  }

  return { output, path: rest[0], prompt: rest.slice(1).join(" ").trim() || undefined };
}

async function executeVision(args: string[], ctx: CommandContext): Promise<ExecResult> {
  const { output, path, prompt, error } = parseVisionArgs(args);
  if (error) {
    return { stdout: "", stderr: `${error}\n`, exitCode: 2 };
  }

  const fsPath = resolvePath(path, ctx.cwd);
  let bytes: Uint8Array;
  try {
    // readFileBuffer, not readFile — the latter decodes to a UTF-8 string,
    // which destroys binary image data.
    bytes = await ctx.fs.readFileBuffer(fsPath);
  } catch {
    return { stdout: "", stderr: `vision: cannot read file: ${path}\n`, exitCode: 1 };
  }

  try {
    const text = await runVision(bytes, fsPath, prompt);

    if (output) {
      await writeOutputFile(ctx.fs, resolvePath(output, ctx.cwd), text);
      return { stdout: "", stderr: "", exitCode: 0 };
    }

    return { stdout: text.endsWith("\n") ? text : `${text}\n`, stderr: "", exitCode: 0 };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { stdout: "", stderr: `${message}\n`, exitCode: 1 };
  }
}

export const visionCommands: Command[] = [defineCommand("vision", executeVision)];
