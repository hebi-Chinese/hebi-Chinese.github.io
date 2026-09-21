# 1.4 mobile adaptation

User approved the second local preview on 2026-09-21. Implement its mobile-only layout in existing surfaces; no commit, push, deployment or version release is requested.

## Accepted behavior

- Up to 760 CSS px: About alternates text/glyph sides, keeps left-aligned copy, six authored entries and the scroll-drawn connecting line.
- Projects: one centered readable card with neighboring edges, native horizontal snap scrolling, circular previous/next and swipe across 1↔5. Keep project links and selected-card accessibility. No JavaScript gives a complete readable list.
- Blog spacing is tighter. Likes glyph is next to the title. Now glyph remains below its copy with compact gaps.
- Hero, product showcase, desktop composition and content remain unchanged; mobile flow gets its own stacking context to prevent the shortened About surface drawing above later content.

## Architecture

Surface styles stay local. MobileProjectCards owns the mobile carousel and consumes the same typed project catalog as ProjectsWheel. CSS switches visible surfaces at 760px; desktop wheel behavior remains independent and its visibility observer pauses it when hidden. The new runtime reads geometry rather than duplicate breakpoint constants. Boundary copies are progressive enhancements, never authored catalog entries. No new dependencies.

## Acceptance and validation

Test alternating layout and non-overflow at 320/375/430, full cyclic buttons and native scrolling, single accessible active link, resize restoration, reduced motion, no-JS links and desktop wheel visibility. Run existing check/build/browser suite, critical dependency audit and diff checks. Inspect mobile and desktop visually. Browser automation is not physical phone verification.

## Baseline

The approved preview already demonstrates behavior missing from 1.3: mobile About rows all have glyphs on the right; mobile projects still overlap in a perspective wheel; Likes glyph occupies a separate row. Add public behavior tests before implementation to verify these gaps.

## Implementation review

- Changed: About.astro, Blog.astro, HeroAboutFlow.astro, HomeExtras.astro and ProjectsWheel.astro; added MobileProjectCards.astro, mobile-project-cards.ts and tests/mobile-layout.spec.ts.
- Public routes, project catalog, desktop wheel runtime and component props remain unchanged. ProjectsWheel stays a cohesive existing desktop surface; the independent native mobile carousel avoids adding another animation mode to its large runtime.
- Native scroll boundary copies normalize back to canonical cards when scrolling settles. Selection uses catalog slug; numeric positions only express geometry. Only the active link is in the accessibility/tab order; keyboard navigation transfers focus to it. CSS provides the visibility boundary, with no duplicate JS breakpoint.
- Resize guards address observed stale scroll events; selection intent survives a resize before scroll dispatch. Pointer release also settles a boundary when the finger stopped moving before release. Events, observer and settle timer have cleanup paths.
- No dependencies, content edits, version bump, commit, push or deployment.

## Validation evidence

- Baseline failing test: `npx playwright test tests/mobile-layout.spec.ts --project=chromium --grep 'composition.*375' --reporter=line --output=/tmp/hebi-mobile-before` failed on the old all-right glyph positions as expected.
- `npm run check`: 62 files, zero errors/warnings/hints.
- `npm run build`: successful static build of 9 routes.
- `npx playwright test tests/mobile-layout.spec.ts tests/audit-regressions.spec.ts --reporter=line --output=/tmp/hebi-mobile-focus-final`: 54 passed in Chromium/Firefox/WebKit, including cyclic controls, native scrolling, keyboard link opening, resize persistence, accessibility and no-JS links.
- Initial full regression exposed 12 mobile no-JS failures: desktop fallback CSS overrode the hide rule, displaying two lists. Fixed selector specificity without changing the test or its five-link requirement.
- Playwright CLI: simulated touch swipes 1→5→1 settle centered without opening a link. Tested native touch after waiting for fonts/layout; an earlier coordinate probe ran during page repositioning and timed out, then was corrected to position the rail before issuing input.
- 320/360/375/390/414/430/768/1024/1440 × 667px: no horizontal document overflow. Visually reviewed 390 × 844 About, cards and Likes/Now.
- At 1440 × 900 with reduced motion, major section widths/heights/paddings match the v1.3 snapshot.
- `npm audit --omit=dev --audit-level=critical`: zero vulnerabilities. `git diff --check`: clean.
- Test reports, traces and screenshots were directed to `/tmp`, not added to the source worktree. Existing generated directories were not deleted.

Physical Android/iOS/WeChat verification remains a manual release check; browser automation does not claim to replace it.

Final gate: `npm test -- --reporter=line --output=/tmp/hebi-mobile-release-check` — **345 passed (2.7m)** across Chromium, Firefox and WebKit. Its pretest rebuilt the final source successfully. Final `npm run check` again returned zero errors/warnings/hints; `git diff --check` is clean. All generated client JS files total 10,849 gzip bytes, below the existing 25 kB budget. Final changed-surface review: P0=0, P1=0, P2=0, P3=0. No public API/catalog changes; no temporary test/browser artifacts added to the repository.

## Independent audit follow-up

The subsequent independent audit found two P2 issues not covered by the original 345 tests: rapid normal-motion input lost requested selections, and inactive edge links remained focusable/clickable while aria-hidden. The user approved fixes. See [mobile-audit-fixes.md](mobile-audit-fixes.md) for the corrective implementation, regression evidence and latest final gate; the original results above are historical, not a replacement for that follow-up.
