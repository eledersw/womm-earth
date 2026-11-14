---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["components/shell/AppShell.tsx","components/globe/GlobeArea.tsx"]
---

# Surface brief: case workspace (app/page.tsx)

**Scope:** the single-page case workspace (shell, globe window, case panel). **Mode:** Operate.
**Audience and task:** a student, or a judge watching a projector demo, runs one case: pick a variable, place regions, set a period and season, read the evidence, get a verdict, share the URL.
**Constraints:**
- Judged on a projector in a lit hall: strong contrast; thin display type only at 28px and up.
- Up to 4 regions.
- Ownership split: Eleder owns the shell, globe and tokens; Ekaitz owns the panel content, charts and partner.

**Memorable moment:** the globe hangs in open space; you pick places in amber and teal, and the case answers on a pane of glass beside it.
**Unresolved:** final product name and voice (Edur); the partner persona; which of the three colour schemes ships as default.

## Direction contract

**THESIS.** Fragment Studio's silver-on-black language, pinned by the user (fragment.im), joined to liquid glass and a starfield. The interface is quiet chrome; the only colour is the data. Refused: the strip-chart recorder, neon space HUDs, giant hero numbers.

**OWN-WORLD.** Near-black space with faint nebula light and a still starfield. Silver ink (#C9D0D2). Liquid-glass panels: translucent, blurred, bright top edge, 20px radius. Chrome silver action button with dark capitals. Stack Sans Headline (thin figures), Stack Sans Text, Fragment Mono capitals for labels. Region pens amber, teal, orchid, silver; no red or blue. Three schemes: silver, nebula, ember.

**STORY.** A student sees the planet first, adds places on it, presses the one bright button, and reads the evidence on glass.

**FIRST VIEWPORT.** Header floats over space: wordmark left; About, the scheme pill and Share right. Glass case panel left (440px). Globe fills the rest, offset right. Find a place pill top-left of the globe; read-out (lat, lng, regions in thin figures) bottom-right.

**FORM.** User-pinned reference (fragment.im) plus liquid glass; supersedes roll 1a0d8f65 and the strip-chart contract (3670b4b9).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
