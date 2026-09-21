# Home section navigation

Status: implemented and verified locally (2026-09-20); not committed or deployed.

## Approved behavior

About, Work and Likes navigate within the complete homepage with a quick scroll that drives the existing page-tilt/cover motion. Essays, Notes and their articles remain independent routes. Preserve the first four surfaces, authored copy, font changes and concurrent HeroLogo zoom work.

- About → `/#about` (second surface, landed after the panel flattens).
- Work → `/#work` (existing fourth-surface project wheel, preserving the previous Work destination).
- Likes → `/#likes`; existing Likes and Now text is moved intact to the end of the homepage, after Blog.
- `/about`, `/projects`, `/likes`, `/now` become compatibility redirects to home fragments.
- The approved SVG logo appears in the global navigation on every page.
- Same-document moves animate for about 560 ms; reduced motion and initial deep links land immediately. Manual wheel/touch/scroll keys interrupt the animation. Back/forward and direct fragment reloads must work.
- Native anchors remain functional without JavaScript. Mobile menu closes before same-page scrolling; focus moves to the destination heading.

## Architecture and evidence

Navigation destinations remain in `src/data/site.ts`. Homepage regions expose stable fragment IDs. A dedicated section-navigation runtime mounted from BaseLayout owns document links, history and the bounded scroll animation; existing motion modules continue responding to scroll. No second animation rewrites their transforms. The single mount function intentionally keeps its small event handlers and shared frame/lifecycle state together (a bounded exception to the 50-line function guideline); its public interface is one zero-argument mount call and the declared section anchors.

Legacy routes render a shared zero-delay meta-refresh component with a normal link fallback. Astro's default generated redirect introduced a two-second delay, so the shared component explicitly sets zero while retaining no-JS support and the same catalog destinations.

References:
- https://docs.astro.build/en/guides/routing/#redirects (static redirects generate meta refresh)
- https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollTo
- https://developer.mozilla.org/en-US/docs/Web/API/History/pushState

## Verification

First reproduce the existing failure through public navigation: clicking About changes pathname and removes the rest of the homepage; article-page branding lacks its image. Add regression coverage for same-document navigation, landing/focus, return from reading pages, legacy redirects, history, no-JS and reduced-motion behavior. Update prior standalone-page assertions to reflect the explicitly approved route contract. Run full project gates and desktop visual checks.

## Results

- Before implementation: the new About navigation test failed because the browser navigated to `/about/` instead of `/#about`, reproducing the reported behavior.
- `npm run check`: 54 files, 0 errors, 0 warnings, 0 hints.
- `npm test -- --config /Users/mac/Documents/ChatGPT/网站/output/home-nav-tests.config.ts --workers=4`: production build passed; 288 tests passed and 3 browser variants of one obsolete Hero-copy assertion failed. That assertion was scoped to Hero because the unchanged Now text now legitimately appears later on home.
- Final production rebuild and focused re-verification of `section-navigation.spec.ts` plus the corrected Hero assertion: 36 tests passed in Chromium, Firefox and WebKit (33 seconds). Includes intermediate animation frames, Escape cancellation, no-JS anchors/redirects, reduced-motion mobile menu/focus, direct-hash reloads, same-document navigation, history and reading-page Logo/return behavior. No failed cases remain unaddressed.
- `npm audit --omit=dev --audit-level=critical`: 0 vulnerabilities.
- `git diff --check`: passed.
- Desktop visual check at 1440×900: About settles with its heading approximately 140px below the viewport top, panel flat, and Logo visible; Work settles on the project wheel. Essays retains the SVG Logo and links back to `/#about`.
- An independent static server on 4352 was used for testing because 4338 was occupied by another preview. The temporary config changes only server location/report paths; tracked Playwright config and assertions were not weakened. Logs/results are in the design workspace `output/home-nav-*.log` / `output/home-nav-results`, outside the repository.
- Temporary review screenshots removed and review browser closed. Existing unrelated reports and the user's running development server were preserved.
- Review: no P0/P1 or unresolved P2 found for this change. Typography's documented local-font delivery limitation is unchanged and outside this task.

## Changed surfaces

`Nav.astro`, `SiteIndex` via its shared catalog, Hero CTA, `HeroAboutFlow.astro`, `ProjectsWheel.astro`, `BaseLayout.astro`, homepage assembly, four legacy routes, shared CSS anchor margin. New `HomeExtras.astro`, `LegacyRedirect.astro`, `section-navigation.ts`, and public navigation tests. Existing route tests now target the canonical fragments; concurrent HeroLogo zoom changes were preserved.
