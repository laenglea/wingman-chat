import { type Command, type CommandContext, defineCommand, type ExecResult } from "just-bash/browser";
import { getConfig } from "@/shared/config";
import { inferContentTypeFromPath } from "@/shared/lib/fileTypes";
import { getFileName } from "@/shared/lib/utils";
import { resolvePath, writeOutputFile } from "./commandUtils";

export async function runOcr(bytes: Uint8Array, path: string): Promise<string> {
  const config = getConfig();
  if (!config.extractor) {
    throw new Error("ocr: no document extraction service configured");
  }
  if (bytes.length === 0) {
    throw new Error(`ocr: file is empty: ${path}`);
  }

  // Ship the original filename and content type — the backend extractor
  // routes uploads by content type and rejects ones it cannot identify.
  const name = getFileName(path);
  const type = inferContentTypeFromPath(name);
  if (!type) {
    throw new Error(`ocr: cannot determine document type of ${name} — use a known file extension like .pdf or .docx`);
  }
  const text = await config.client.extractText(new File([bytes as BlobPart], name, { type }));
  console.debug(`ocr: ${path} (${type}, ${bytes.length} bytes) → ${text.length} chars`);
  return text;
}

function parseOcrArgs(args: string[]): { output?: string; path: string; error?: string } {
  let output: string | undefined;
  const rest: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-o" || arg === "--output") {
      const value = args[++i];
      if (!value) return { path: "", error: `ocr: option ${arg} requires an argument` };
      output = value;
    } else {
      rest.push(arg);
    }
  }

  if (rest.length !== 1) {
    return { path: "", error: "usage: ocr [-o output.txt] <file>" };
  }

  return { output, path: rest[0] };
}

async function executeOcr(args: string[], ctx: CommandContext): Promise<ExecResult> {
  const { output, path, error } = parseOcrArgs(args);
  if (error) {
    return { stdout: "", stderr: `${error}\n`, exitCode: 2 };
  }

  const fsPath = resolvePath(path, ctx.cwd);
  let bytes: Uint8Array;
  try {
    // readFileBuffer, not readFile — the latter decodes to a UTF-8 string,
    // which destroys binary formats like PDF and DOCX.
    bytes = await ctx.fs.readFileBuffer(fsPath);
  } catch {
    return { stdout: "", stderr: `ocr: cannot read file: ${path}\n`, exitCode: 1 };
  }

  try {
    const text = await runOcr(bytes, fsPath);

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

export const ocrCommands: Command[] = [defineCommand("ocr", executeOcr)];
