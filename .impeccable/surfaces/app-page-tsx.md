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
- Judged on a projector in a lit hall: large type, strong contrast, no thin grey text.
- Up to 4 regions.
- Ownership split: Eleder owns the shell, globe and tokens; Ekaitz owns the panel content, charts and partner.

**Memorable moment:** the evidence trace draws across the chart paper like a recorder pen, then the verdict lands as a calibration stamp.
**Unresolved:** final product name and voice (Edur); the partner persona.

## Direction contract

**THESIS.** Every case is a recording run on one instrument. The globe is the probe window, the panel is the chart roll, and the verdict is a calibration stamp. Refused: the dark space dashboard with a glowing globe and a glass side panel.

**OWN-WORLD.**
- **Ground and frame:** chart-paper ground ruled in pale green, minor and major grid lines. Carbon ink. An enamel graphite-green instrument frame with machined 1px seams. A near-black viewing window for the globe.
- **Pens:** four pen inks (red, blue, green, violet), one per region channel.
- **Type:** Barlow; condensed uppercase for scale labels; mono only for codes and readouts.
- **Stamp:** an ink-outlined, condensed uppercase stamp, set slightly off-square.

**STORY.** The student sees the instrument trace the evidence before any verdict appears, so they trust the stamp. They run a case and share its URL.

**FIRST VIEWPORT.**
- **Header:** an enamel strip with the name plate on the left, Share and About on the right.
- **Left, 440px:** the chart roll, ruled paper with a stepped five-step rail down its edge.
- **Right:** the viewing window, with the globe filling it, region search top-left and the legend bottom-left.
- **Primary action:** clicking the globe or searching.

**FORM.** Strip-chart recorder: candidate 4 of 7 on my ordered list, seed key 3670b4b9. Raises:
- From the acetate manual: a stepped rail showing the case's extent.
- From the dev console: the frame never reflows.
- From the j-card: four pen slots as visible capacity.
- From the timetable: two type sizes in the panel.
- From the doujin catalog: region codes link to their place on the globe.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
