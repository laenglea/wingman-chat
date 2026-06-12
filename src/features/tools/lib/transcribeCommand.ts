import type { Command } from "just-bash/browser";
import { getConfig } from "@/shared/config";
import { inferContentTypeFromPath } from "@/shared/lib/fileTypes";
import { getFileName } from "@/shared/lib/utils";
import { defineFileToTextCommand, resolveModel } from "./commandUtils";

export async function runTranscribe(bytes: Uint8Array, path: string): Promise<string> {
  const config = getConfig();
  if (!config.stt) {
    throw new Error("transcribe: no transcription service configured");
  }
  if (bytes.length === 0) {
    throw new Error(`transcribe: file is empty: ${path}`);
  }

  const name = getFileName(path);
  const type = inferContentTypeFromPath(name);
  // Video containers are accepted too — voice memos and screen recordings
  // commonly arrive as .mp4/.webm, and transcription backends handle them.
  if (!type || !(type.startsWith("audio/") || type.startsWith("video/"))) {
    throw new Error(`transcribe: not an audio file: ${name} — use a known audio extension like .mp3 or .wav`);
  }

  const model = await resolveModel(config.stt.model, "transcriber");
  const text = await config.client.transcribe(model, new Blob([bytes as BlobPart], { type }));
  console.debug(`transcribe: ${path} (${type}, ${bytes.length} bytes) → ${text.length} chars`);
  return text;
}

export const transcribeCommands: Command[] = [
  defineFileToTextCommand({
    name: "transcribe",
    usage: "usage: transcribe [-o output.txt] <audio>",
    run: runTranscribe,
  }),
];
