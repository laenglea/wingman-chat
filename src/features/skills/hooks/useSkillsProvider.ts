import { useMemo } from "react";
import {
  createSkillsProvider,
  libraryEntries,
  SKILLS_PROVIDER_ID,
  type SkillEntry,
  type SkillSources,
} from "@/features/skills/lib/skillsProvider";
import type { ToolProvider } from "@/shared/types/chat";
import { useSkills } from "./useSkills";
import { useSkillTemplates } from "./useSkillTemplates";

/**
 * Global, user-toggleable Skills tool (mirrors the Web Search tool), available
 * only when no agent is active. It exposes skills from two independently
 * selectable sources (an option of the same tool):
 *
 * - personal — the user's own editable OPFS skills.
 * - catalog  — the shipped template catalog.
 *
 * Both can be on at once; a personal skill shadows a template of the same name.
 * Template content is fetched lazily on `read_skill`; only name/description go
 * into the prompt. Shares the "skills" provider id with the agent-scoped
 * provider — they never coexist (this one is registered only with no agent).
 *
 * Returns null when no source is selected or there's nothing to expose.
 */
export function useSkillsProvider(sources: SkillSources): ToolProvider | null {
  const { skills } = useSkills();
  const { templates, loadTemplate } = useSkillTemplates();

  return useMemo<ToolProvider | null>(() => {
    const entries: SkillEntry[] = [];

    if (sources.personal) {
      entries.push(...libraryEntries(skills));
    }

    if (sources.catalog) {
      // When personal skills are also included, drop templates they shadow by
      // name — the user's editable version wins.
      const personalNames = new Set(skills.map((s) => s.name));
      const templateEntries: SkillEntry[] = templates
        .filter((t) => !(sources.personal && personalNames.has(t.name)))
        .map((t) => ({
          name: t.name,
          description: t.description,
          loadContent: async () => {
            const parsed = await loadTemplate(t.path);
            if (!parsed) throw new Error(`Template "${t.path}" unavailable`);
            return parsed.content;
          },
        }));
      entries.push(...templateEntries);
    }

    return createSkillsProvider(entries, {
      id: SKILLS_PROVIDER_ID,
      name: "Skills",
      description: "Available skills",
    });
  }, [skills, templates, loadTemplate, sources.personal, sources.catalog]);
}
