import { Sparkles } from "lucide-react";
import type { Skill } from "@/features/skills/lib/skillParser";
import skillsPrompt from "@/features/skills/prompts/skills.txt?raw";
import type { Tool, ToolProvider } from "@/shared/types/chat";

/**
 * Builds the "skills" tool provider for a given set of available skills.
 *
 * Shared by both entry points:
 * - Agent-scoped (useAgentProviders): the subset enabled on the active agent.
 * - Global toggle (useSkillsProvider): the whole library, when no agent is active.
 *
 * Both produce the same provider id, `read_skill` tool, and prompt; they differ
 * only in which skills are exposed. `read_skill` resolves against the provided
 * list, so callers don't need a separate scoping guard or content resolver —
 * each Skill already carries its full content (and any future files).
 *
 * Returns null when there are no skills to expose.
 */
export function createSkillsProvider(skills: Skill[]): ToolProvider | null {
  if (skills.length === 0) return null;

  const byName = new Map(skills.map((s) => [s.name, s]));

  const tools: Tool[] = [
    {
      name: "read_skill",
      description: "Read the full content and instructions of an available skill.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name of the skill to read.",
          },
        },
        required: ["name"],
      },
      function: async (args: Record<string, unknown>) => {
        const skillName = args.name as string;
        if (!skillName) {
          return [{ type: "text" as const, text: JSON.stringify({ error: "No skill name provided" }) }];
        }
        const skill = byName.get(skillName);
        if (!skill) {
          return [{ type: "text" as const, text: JSON.stringify({ error: `Skill "${skillName}" not found` }) }];
        }
        return [
          {
            type: "text" as const,
            text: JSON.stringify({
              name: skill.name,
              description: skill.description,
              instructions: skill.content,
            }),
          },
        ];
      },
    },
  ];

  const skillsXml = skills
    .map(
      (skill) =>
        `  <skill>\n    <name>${skill.name}</name>\n    <description>${skill.description}</description>\n  </skill>`,
    )
    .join("\n");

  return {
    id: "skills",
    name: "Skill Catalog",
    description: "Explore skills — for best results, use a specialized agent",
    icon: Sparkles,
    instructions: skillsPrompt.replace("{skillsXml}", skillsXml) || undefined,
    tools,
  };
}
