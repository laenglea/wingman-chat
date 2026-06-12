import { type Command, type CommandContext, defineCommand, type ExecResult } from "just-bash/browser";
import { getConfig } from "@/shared/config";
import { inferContentTypeFromPath } from "@/shared/lib/fileTypes";
import { getFileName } from "@/shared/lib/utils";

export async function runOcr(bytes: Uint8Array, path: string): Promise<string> {
  const config = getConfig();
  if (!config.extractor) {
    throw new Error("ocr: no document extraction service configured");
  }

  // Ship the original filename and content type so the backend extractor can
  // route by format; unknown extensions fall back to content sniffing.
  const name = getFileName(path);
  const type = inferContentTypeFromPath(name) ?? "application/octet-stream";
  return config.client.extractText(new File([bytes], name, { type }));
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

function resolvePath(path: string, cwd: string): string {
  return path.startsWith("/") ? path : `${cwd}/${path}`;
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
      const outPath = resolvePath(output, ctx.cwd);
      const dir = outPath.substring(0, outPath.lastIndexOf("/"));
      if (dir) {
        try {
          await ctx.fs.mkdir(dir, { recursive: true });
        } catch {
          // exists
        }
      }
      await ctx.fs.writeFile(outPath, text);
      return { stdout: "", stderr: "", exitCode: 0 };
    }

    return { stdout: text.endsWith("\n") ? text : `${text}\n`, stderr: "", exitCode: 0 };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { stdout: "", stderr: `${message}\n`, exitCode: 1 };
  }
}

export const ocrCommands: Command[] = [defineCommand("ocr", executeOcr)];
