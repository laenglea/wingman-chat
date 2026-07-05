---
name: polish-pass
description: Final pre-ship quality gate for an interactive or visual Studio build — checks accessibility, AI-slop tropes, hierarchy/rhythm, and interaction states (dispatched in parallel via the agent tool), then fixes what's found. Use before delivering any hi-fi HTML/UI artifact, or when asked to "polish this" / make it "ready to ship".
---

# Polish Pass

The umbrella gate before an interactive/visual build goes to the user. A polished and an unpolished
build are the same idea at different levels of care — the gap is what people actually notice. Don't
run this on work that's still mid-structure (broken layout, missing sections, content the user is
still iterating on) — say so and ask whether to polish now or after the structure settles.

## Dispatch four checks

Launch all four with the `agent` tool in a single message — each is a self-contained briefing (the
agent has no access to this conversation), so pass it the file path and tell it to read the file
itself before checking. Tell each agent explicitly: report every issue including low-confidence
ones, with a severity estimate — filtering happens after aggregation, not by self-censoring in the
agent.

1. `read_skill accessibility-review` and audit contrast, semantic HTML, keyboard/focus, and
   motion/forms.
2. `read_skill ai-slop-check` and scan for gradients, emoji, trope cards, weak illustration,
   overused fonts, the cream/serif/terracotta house style.
3. `read_skill hierarchy-rhythm-review` and check size/color/weight/position/density hierarchy plus
   spacing/type-scale rhythm.
4. `read_skill interaction-states-pass` and inventory every interactive element for
   hover/active/disabled/focus/loading plus transitions and action feedback.

If the build is small enough to hold in one pass, running all four checks yourself sequentially is
fine — dispatch is for when parallelizing genuinely saves time, not a mandatory ritual.

## Aggregate and fix

Merge the four reports, de-duplicating overlaps (a removed focus ring shows up in both accessibility
and interaction-states — one entry). Group into:

1. **Blockers** — accessibility failures (contrast under WCAG, no keyboard support, missing focus
   rings, missing labels). Fix all of them.
2. **Quality issues** — AI-slop tropes, broken hierarchy, missing interaction states. Fix all of
   them.
3. **Polish recommendations** — subtler calls (a color-tone nudge, tightening the spacing scale).
   Apply when in scope, flag when it's a bigger change than asked for.

Fix directly. For a finding that's a false positive or genuinely out of scope (a third-party embed
you can't touch), note it and move on rather than arguing with it.

## Re-check and hand off

After fixing, glance at the high-risk spots: did a contrast fix wash out the brand color, does a new
focus ring overlap neighboring content, does the CTA actually feel primary now? Fix anything off.

End with one short summary: ready to ship / ready once the user reviews flagged calls / needs more
iteration before polish is worth doing — plus blockers fixed, polish applied, and open decisions. No
recap of what the user just watched you do.
