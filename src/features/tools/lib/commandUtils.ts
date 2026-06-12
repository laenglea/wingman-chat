import type { CommandContext } from "just-bash/browser";

/** Resolve a command-line path argument against the shell's working directory. */
export function resolvePath(path: string, cwd: string): string {
  return path.startsWith("/") ? path : `${cwd}/${path}`;
}

/** Write a command's output file, creating parent directories as needed. */
export async function writeOutputFile(
  fs: CommandContext["fs"],
  path: string,
  content: string | Uint8Array,
): Promise<void> {
  const dir = path.substring(0, path.lastIndexOf("/"));
  if (dir) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch {
      // exists
    }
  }
  await fs.writeFile(path, content);
}
