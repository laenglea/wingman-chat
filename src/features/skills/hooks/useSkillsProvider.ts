import { Sparkles } from "lucide-react";
import { useMemo } from "react";
import skillsPrompt from "@/features/skills/prompts/skills.txt?raw";
import type { Tool, ToolProvider } from "@/shared/types/chat";
import { useSkills } from "./useSkills";

/**
 * Global, user-toggleable Skills tool (mirrors the Web Search tool): when
 * enabled it exposes *all* skills in the library to the model via `read_skill`,
 * with the full skill list injected into the system prompt.
 *
 * Shares the "skills" provider id with the agent-scoped skills provider
 * (useAgentProviders). They never coexist: chat-input toggles are only shown
 * when no agent is active, and ToolsProvider skips this provider when the
 * active agent already contributes a "skills" provider.
 */
export function useSkillsProvider(): ToolProvider | null {
  const { skills, getSkill } = useSkills();

  return useMemo<ToolProvider | null>(() => {
    if (skills.length === 0) return null;

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
          const skill = getSkill(skillName);
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
      name: "Skills",
      description: "Use specialized skills",
      icon: Sparkles,
      instructions: skillsPrompt.replace("{skillsXml}", skillsXml) || undefined,
      tools,
    };
  }, [skills, getSkill]);
}
