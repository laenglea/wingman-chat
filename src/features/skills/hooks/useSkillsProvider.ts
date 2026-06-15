import { useMemo } from "react";
import { createSkillsProvider } from "@/features/skills/lib/skillsProvider";
import type { ToolProvider } from "@/shared/types/chat";
import { useSkills } from "./useSkills";

/**
 * Global, user-toggleable Skills tool (mirrors the Web Search tool): when
 * enabled it exposes *all* skills in the library to the model.
 *
 * Shares the "skills" provider id with the agent-scoped skills provider
 * (useAgentProviders). They never coexist: ToolsProvider only registers this
 * one when no agent is active; with an agent, skills come from its curated set.
 */
export function useSkillsProvider(): ToolProvider | null {
  const { skills } = useSkills();
  return useMemo<ToolProvider | null>(() => createSkillsProvider(skills), [skills]);
}
