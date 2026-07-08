---
name: ai-slop-check
description: Scan a Studio HTML/UI build for generic AI-template visual tropes — gradients, emoji decoration, rounded-corner-with-left-border cards, hand-drawn SVG, overused fonts, the cream+serif+terracotta house style — and fix them. Use when asked "does this look AI-generated" / "remove the slop", when a mid-iteration build risks reading as generic, or as part of polish-pass (which already includes this check — don't run both at ship time).
---

# AI Slop Check

Scan for the visual tropes that make a design read as "AI-generated template" rather than
intentional. A page indistinguishable from a hundred other AI outputs failed to look like _this_
subject's design. Fix everything found, directly in the file — this isn't a report to hand back,
it's a pass with your hands on the code.

Read the file (and any CSS/tokens it references) before judging — resolve actual hex/px values,
don't guess from memory.

## What to detect and replace

**Gradients.** Rainbow or 3+ stop gradients, saturated purple→pink / orange→pink hero blends, overlay
gradients that don't improve legibility → flat color, or two low-contrast stops in the same hue
family.

**Emoji.** 🚀/✅/🎉 prepended to headlines, buttons, or list items with no brand reason → remove; if
the layout leaned on the emoji for visual weight, swap in a real icon (Feather, Material, Phosphor,
Heroicons) or fix the typographic hierarchy instead.

**Cards.** `border-radius: 12px; border-left: 4px solid #...` as the _default_ container style → a
subtle shadow, thin all-around border, or background contrast. Keep the left-border only where it's
semantic (callout, alert, status) or matches an existing design system.

**Imagery.** Hand-drawn SVG people/scenes/blobs, "giant-head" AI-style illustration → real
photography, a professional icon set, or an honest striped placeholder with a monospace label
(`product shot 1200×800`). A placeholder shows intent; a weak illustration shows you didn't have the
asset.

**Type.** Inter, Roboto, Arial, Fraunces, or a bare system stack used as a silent default (no brand or
user reason) → a font chosen with intent for this subject; `read_skill frontend-design` for pairing
guidance.

**White/black.** Exact `#FFFFFF` on exact `#000000` → subtly toned instead (`#FAFAFA`/`#1A1A1A`
neutral, or toned to match the palette's hue).

**Color values.** Five near-identical blues (`#0066CC`, `#0077DD`, `#3498DB`...) invented inline →
consolidate to a token or an `oklch()`-derived palette (same lightness/chroma, varied hue) so hues
read as related.

**Spacing.** Off-scale values (`padding: 7px 15px`, `gap: 13px`) → snap to a 4px or 8px scale.

**The cream/serif/terracotta house style.** `#F4F1EA`-family background + serif display (Georgia,
Playfair, Fraunces) + italic word-accents + terracotta/amber accent, all together, with no brand
reason → today's default-template look, especially wrong on dashboards, dev tools, fintech,
healthcare, or enterprise surfaces. Any one element can be a deliberate choice for editorial/
hospitality/portfolio work; all of them together without a stated reason is a trope. Replace with a
direction actually chosen for this brief.

## Fix and report

Apply fixes directly. Where more than one replacement is reasonable (which non-Inter font, exactly
which shade), pick the most defensible option and note it in the handoff so the user can override.
End with one line: tropes found (by category) and what changed — not a table, not a report.
