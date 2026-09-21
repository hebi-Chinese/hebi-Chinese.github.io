# About continuous layout and typography integration

Status: implemented and verified locally; not committed or deployed.

## Approved result

Integrate the continuous, unboxed second surface: Chinese heading capped at 80px, desktop rows at least 240px, alternating text groups and the original six illustrations. Preserve every authored title, paragraph and their order. Keep text visible throughout; no opacity-gated reading. The original Hero tilt and third-sheet cover stay in place.

The connector draws with reading progress and completes before the third surface enters view (64px lead). Use natural layout coordinates so tilt/sticky geometry cannot make progress reverse during forward scrolling. Scroll focus and pointer hover lightly emphasize the corresponding illustration and heading. No new links or invented social destinations.

Typography remains the existing approved A/B implementation in `global.css`: Hannotate SC for Chinese titles, HanziPen SC for short annotations/signature, sans-serif prose and mono metadata. Local font files are not redistributed; cross-device web-font licensing/delivery remains pending.

## Structure

- About owns its markup, CSS and thread runtime. Extract the existing drawings into a single-glyph component without changing paths. Delete the superseded left-column renderer after checking callers.
- HeroAboutFlow exposes explicit `data-profile-*` scroll-context attributes for natural flow origin, sticky hold and next sheet; these are the public geometry contract consumed by About. Existing motion internals remain unchanged.
- SVG clip IDs are unique per About instance. Text/glyph markup is server-rendered. Without JS, text and illustrations remain visible; the optional connector stays hidden because it needs measured geometry.
- Bound observers/events with per-root lifecycle cleanup. Reduced motion shows the complete connector statically and removes movement. No idle animation loop, no new runtime dependency.
- Preserve concurrent Logo, Hero copy and navigation work already in the dirty checkout.

## Verification

Add public layout, connector-completion, monotonic-progress, reduced-motion and no-JS regressions. Update obsolete left-column and 96px assertions to the approved new design. Run Astro diagnostics, production build, cross-browser tests, critical dependency audit, whitespace check and desktop visual comparisons. Existing width matrix guards overflow; mobile redesign remains deferred.

Sources: https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver ; https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetTop ; https://developer.mozilla.org/en-US/docs/Web/SVG/Element/clipPath

## Final verification

- `npm run check`: 57 files; 0 errors, 0 warnings, 0 hints.
- `npm test -- --config /Users/mac/Documents/ChatGPT/网站/output/home-nav-tests.config.ts --workers=4`: production build passed; **315 tests passed** across Chromium, Firefox and WebKit (3.1 minutes), after the perspective fix below. No assertions were weakened and no test timeout was increased.
- `npm audit --omit=dev --audit-level=critical`: 0 vulnerabilities.
- `git diff --check`: passed.
- Desktop review: approved 80px title and 240px rows; About navigation lands with its title below the fixed header. Connector ends at layout y=1320; drawn height=1440 while the third sheet is still 64px outside the viewport. All six paragraphs have opacity 1.
- Width checks at 320, 375, 768, 1024 and 1440: six groups preserved, no horizontal overflow. This checks basic regression safety, not a new mobile design.
- Chromium actual rendered font inspection: `HannotateSC-W5` title, `HanziPenSC-W3` signature, `PingFangSC-Regular` Chinese prose. Existing font role mappings remain centralized in global.css; no Instrument Serif/Songti/C/D declarations remain in source.
- Test artifacts/logs stay in the separate design workspace `output/about-flow-*.log` and `output/home-nav-results`; temporary review screenshots removed and review browser closed. Existing unrelated worktree reports are untouched.
- Review: no P0/P1 or unresolved P2 in this integration. The previously documented A/B font web-delivery limitation remains deferred; missing fonts use the explicit readable fallback.

## Repository changes

- Replaced `About.astro` with the approved production layout and unique per-instance SVG clip markup.
- Added `ProfileGlyph.astro` (original drawings, one glyph per row) and `profile-thread.ts` (root-owned measuring, progress and lifecycle).
- Removed superseded `ProfileGlyphs.astro`; its existing drawings are preserved in the new component and its prior implementation remains recoverable from Git.
- Added public scroll-context attributes and safe perspective sizing to `HeroAboutFlow.astro`.
- Added `tests/about-flow.spec.ts`, updated obsolete layout/size checks, and added `docs/design/设计规范.md` with the confirmed font and About requirements. No authored profile copy or data order changed.
- Preserved all concurrent Logo, Hero introduction and earlier font/navigation edits.

## Integration finding: perspective boundary

The approved longer About surface is 1776px tall at 1440×900. Reusing the previous fixed 1250px perspective projected its lower edge to approximately 1478px depth, beyond the camera plane. The last two row rectangles expanded to roughly 14,138px and 22,370px tall, with the final top negative. Firefox homepage axe scans consistently timed out (initial full run and both isolated reproductions).

HeroAboutFlow now uses `max(previous base distance, About height × 1.15)` for perspective. The existing cover measurement supplies `--about-height`; tilt direction, angle and scroll timeline are unchanged. At the same viewport the distance is 2042px, safely beyond the panel. The unchanged Firefox axe scan and a new projected-depth regression then passed (2 tests, 5.9s). This is a geometry correction required by the taller layout, not a relaxed test timeout.
