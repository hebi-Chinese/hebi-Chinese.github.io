# Remove the standalone toolbox section

The user confirmed removal of the technology-stack page. Homepage order becomes Hero/About, commercial ProductShowcase, open-source ProjectsWheel, Blog, Contact. Remove the Skills import, rendered section and its trailing divider, then delete the now-unused Skills component. Update the immersive project section index from 05 to 04. Keep the approved carousel layout and card gestures; card sizing and future logo placement are separate adjustments.

Regression coverage: update the homepage hierarchy assertion to reject the removed heading and confirm project heading follows the showcase directly in the heading sequence; update the scroll transition test to target the actual next project section. Prove the old homepage fails, then run check, cross-browser tests, build, critical audit and diff check. Inspect the transition at mobile and desktop widths. No publish/commit/push.

## Result — 2026-09-10

Removed src/components/Skills.astro and its sole homepage import/render plus trailing divider. Updated src/components/ProjectsWheel.astro section index to 04. Updated tests/site.spec.ts and tests/motion.spec.ts to assert the new section order and scrolling destination. Existing dirty carousel, catalog and card test changes were preserved. No interaction architecture changes beyond removing one composed surface.

Verification:
- Pre-change hierarchy test: failed because toolbox heading still existed.
- npm run check: 42 files, 0 errors, 0 warnings, 0 hints.
- npm test: 180 passed across Chromium, Firefox, WebKit.
- npm run build: 9 routes passed.
- npm audit --omit=dev --audit-level=critical: 0 vulnerabilities.
- git diff --check: passed.
- Manual screenshot inspection at 375px and 1440px confirmed direct showcase-to-project transition and no removed-section placeholder. Both had zero horizontal overflow. Responsive suite additionally covers other breakpoints.
- Review: P0=0, P1=0, P2=0, P3=0 identified. No remaining blocker in removal scope. Larger cards/orbit and a future center logo are confirmed design intentions but not implemented in this removal slice.
- Browser contexts closed and temporary screenshots/test artifacts removed. No commit, push or deployment.
