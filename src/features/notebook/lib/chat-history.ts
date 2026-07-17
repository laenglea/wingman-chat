/**
 * Compaction for persisted notebook-chat agent messages.
 *
 * The chat now keeps the full agent run in its history (assistant tool
 * calls + tool results), so the model remembers what it read and edited
 * across turns. Raw tool traffic is bulky though — a single source read can
 * be 50 KB — so before persisting (and re-sending next turn) we truncate
 * long text payloads. The model is told in its instructions that earlier
 * tool results may be truncated and to re-read before editing.
 */

import type { Message } from "@/shared/types/chat";
import { elideToolArguments } from "@/shared/lib/toolHistoryTrim";

const MAX_TOOL_TEXT_CHARS = 1500;
const TOOL_PREVIEW_CHARS = 1200;

function truncate(text: string): string {
  if (text.length <= MAX_TOOL_TEXT_CHARS) return text;
  return `${text.slice(0, TOOL_PREVIEW_CHARS)}\n…[truncated ${text.length - TOOL_PREVIEW_CHARS} chars — re-read the source if you need the full current text]`;
}

/** Return a copy of an agent message with bulky tool payloads truncated. */
export function compactAgentMessage(message: Message): Message {
  let changed = false;
  const content = message.content.map((part) => {
    if (part.type === "tool_call") {
      const args = elideToolArguments(part.arguments, {
        maxChars: MAX_TOOL_TEXT_CHARS,
        previewChars: TOOL_PREVIEW_CHARS,
      });
      if (args === part.arguments) return part;
      changed = true;
      return { ...part, arguments: args };
    }
    if (part.type === "tool_result") {
      const args = elideToolArguments(part.arguments, {
        maxChars: MAX_TOOL_TEXT_CHARS,
        previewChars: TOOL_PREVIEW_CHARS,
      });
      const result = part.result.map((r) => {
        if (r.type !== "text" || r.text.length <= MAX_TOOL_TEXT_CHARS) return r;
        return { ...r, text: truncate(r.text) };
      });
      const resultChanged = result.some((r, i) => r !== part.result[i]);
      if (args === part.arguments && !resultChanged) return part;
      changed = true;
      return { ...part, arguments: args, result };
    }
    return part;
  });
  return changed ? { ...message, content } : message;
}
