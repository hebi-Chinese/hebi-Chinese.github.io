# Whole-card GitHub navigation

The user selected Deepulse, Codex 工作看板, MIKU for Codex, CC–MiMo Bridge and Euterpe, and approved product-first descriptions. Every card must provide one native link to its specific GitHub repository. Clicking card padding or copy, keyboard Enter, and touch must all navigate. Remove flip/detail actions and nested links. Preserve the existing external-link new-tab behavior.

This slice updates the shared catalog and ProjectsWheel on home and /projects. The replacement for the rejected perspective wheel is still under design; this slice does not settle that layout or remove the toolbox page. Existing page composition and commercial showcase remain unchanged. Native anchors need no new dependencies.

Validation: add whole-card public navigation tests before implementation, exercise all five URLs and keyboard access on both routes, run repository gates, inspect responsive surfaces. The remaining large wheel module owns its existing instance-local carousel lifecycle; removing that lifecycle belongs to the coming layout replacement.

Shared-catalog review: HeroBlueprint also consumes optional project signals. Preserve its four marker locations, assigning current project names rather than leaving an empty marker layer. No Hero layout or runtime changes.

## Verification and review — 2026-09-10

- Before implementation: the new project navigation test failed against the previous catalog/interaction.
- npm run check: 43 files, 0 errors / warnings / hints.
- npm test: 168 passed across Chromium, Firefox and WebKit after the Safari hit-testing fix.
- After preserving the shared Hero marker metadata, npm test -- tests/projects.spec.ts tests/motion.spec.ts: 15 passed across all three engines; npm run check and npm run build passed again.
- npm run build: 9 routes built.
- npm audit --omit=dev --audit-level=critical: 0 vulnerabilities.
- git diff --check: passed.
- Visually inspected project cards at mobile, tablet and desktop widths (screenshots captured at 320, 375, 768, 1024, 1440) and the homepage surface. Mobile touch navigation at 375px opened the Deepulse GitHub URL. All five repository destinations and keyboard Enter were exercised on both routes by browser tests with intercepted external responses.
- Safari root cause: preserved 3D coordinate spaces inside the zero-size carousel group produced a mismatch between painted card bounds and hit testing. Flattening the group and inner content fixes padded-edge clicks; the link itself now owns the complete outer card. No forced clicks or weakened assertions.
- HeroBlueprint still has four catalog-driven markers; its runtime and layout were not edited.
- Diff review: P0=0, P1=0, P2=0, P3=0 identified in this slice. Existing carousel active-card selection remains until the layout replacement. This implementation does not claim the rejected carousel has been redesigned or the toolbox page removed.
- No commit, push or deployment. Real-device Safari and screen-reader manual testing were not performed.
- Task browser session closed; temporary task screenshots and generated test reports/results removed.

Changed files:
- src/components/ProjectsWheel.astro — one outer native anchor per card; remove flip action, nested title links and back face; fix Safari hit testing.
- src/data/site.ts — approved five projects, copy and concrete repository links, retaining four Hero signal positions.
- tests/projects.spec.ts — card padding and keyboard navigation on home and /projects.
- docs/tasks/project-card-links.md — behavior, scope and verification record.
