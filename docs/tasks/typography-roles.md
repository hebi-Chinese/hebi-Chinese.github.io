# Typography roles — 2026-09-20

Status: implemented and verified locally; not committed or deployed.

## Intended result

Use Hannotate SC (A) for Chinese page/section/profile headings, HanziPen SC (B) for existing signatures and brief annotations, explicit sans-serif stacks for prose and controls, and JetBrains Mono for dates and indexes. Keep Latin product names in Space Grotesk. Remove Instrument Serif from the default site font system.

Preserve authored text, the first four surfaces, their order, graphics, links, and interaction behavior. Typography metrics may change to fit the new glyphs; no layout redesign or mobile adaptation project is included.

## Font delivery boundary

The approved samples used fonts installed on the user's Mac. The initial local-only delivery has been superseded by self-hosted WOFF2 after the user confirmed web distribution authorization. See `webfont-delivery.md`. The exact approved faces are preserved, with sans-serif fallback on loading failure; OS rasterization can still differ.

Local CJK faces use a Unicode range so Latin names continue using the chosen Latin font. Sources:
- https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/src
- https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/unicode-range

## Scope

- `src/styles/global.css` and `webfonts.css`: self-hosted font faces, semantic family tokens, shared sizes and heading metrics.
- `src/layouts/BaseLayout.astro`: remove unused Instrument Serif request.
- Existing component/page CSS: map each font to a role and correct undersized real information labels.
- Preserve original typography inside product artwork and decorative miniature UI.
- No public props, routes, data models, copy or runtime dependencies change.

## Verification

Run existing Astro checks, production build, cross-browser tests, critical dependency audit and whitespace checks. Inspect desktop home, About, product/projects and article surfaces; check the existing width matrix for regressions only. Confirm real loaded font faces rather than just the declared CSS family. Check fallback readability in the existing browser matrix. Remove newly generated browser reports after recording results.

## Results

- `npm run check`: 48 files, 0 errors / warnings / hints.
- `npm test -- --workers=4`: pretest production build passed (9 pages); 249 tests passed across Chromium, Firefox and WebKit in 3.5 minutes. Covers existing content, routes, interactions, accessibility, reduced motion and viewport matrix.
- `npm audit --omit=dev --audit-level=critical`: 0 vulnerabilities.
- `git diff --check`: passed.
- Real browser font inspection (Chromium CDP): Hero/About titles resolve to `HannotateSC-W5`, footer signature to `HanziPenSC-W3`, Chinese descriptions to `PingFangSC-Regular`, Latin project name to Space Grotesk and product numbering to JetBrains Mono.
- Visually inspected desktop homepage, About, Notes article and Projects. No new text overlap or clipping observed in those views. Typography is the only visual change; no authored copy, content data, layout structure or interaction code was edited.
- Review: no P0/P1 or unaddressed implementation defects found in this typography change. Cross-device delivery of the exact proprietary A/B fonts remains an explicitly documented interim limitation, not verified deployment parity.
- Browser verification artifacts are kept outside the repository; temporary screenshots are removed after inspection.

## Follow-up

Resolve web embedding rights/delivery for the approved fonts before claiming the same artwork on devices without those fonts. Layout design and dedicated mobile adaptation remain separate work.
