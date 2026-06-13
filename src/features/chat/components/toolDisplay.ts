import { type LucideIcon, SquareCode, SquareTerminal } from "lucide-react";
import { tryParseToolArguments } from "@/shared/lib/toolArguments";
import { getToolDisplayName } from "@/shared/lib/utils";

export interface ToolPresentation {
  /** Type icon for code/shell tools; undefined → caller uses the provider icon / default. */
  Icon?: LucideIcon;
  label: string;
  /** Render the label monospaced (a shell command). */
  mono: boolean;
}

// How a tool call is labelled in the chat. Python and shell are the common,
// always-available tools, so they get plain-language, state-aware labels rather
// than the verbose "Execute Python Code". Python omits the code preview (the
// first line is almost always an import); shell shows the command itself.
export function toolPresentation(
  name: string,
  args: string | undefined,
  state: { running?: boolean; error?: boolean },
): ToolPresentation {
  if (name === "execute_python_code") {
    const label = state.error ? "Code failed" : state.running ? "Executing code…" : "Ran code";
    return { Icon: SquareCode, label, mono: false };
  }

  if (name === "execute_bash_code") {
    const command = String(tryParseToolArguments(args ?? "")?.command ?? "").trim();
    if (command) return { Icon: SquareTerminal, label: command, mono: true };
    return { Icon: SquareTerminal, label: state.error ? "Command failed" : "Running command…", mono: false };
  }

  return { label: getToolDisplayName(name), mono: false };
}

/** The code/command and its language for the expanded view, or null. */
export function extractToolCode(args: string | undefined): { code: string; language: string } | null {
  const parsed = tryParseToolArguments(args ?? "");
  if (parsed && typeof parsed.code === "string" && parsed.code) return { code: parsed.code, language: "python" };
  if (parsed && typeof parsed.command === "string" && parsed.command) return { code: parsed.command, language: "bash" };
  return null;
}
