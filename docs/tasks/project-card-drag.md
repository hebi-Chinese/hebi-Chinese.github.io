# Project-card pointer gestures and reversed side tilt

User reports that making cards full links disabled dragging when pressing a card. Fix the interaction within ProjectsWheel without changing its circular layout. Prior sphere prototype is rejected. Reverse the sign of the immersive side-card yaw only; retain orbit, depth, card sizing and content.

Gesture contract on home and /projects:
- A short stationary primary-pointer click keeps native GitHub navigation, including keyboard Enter and modified clicks.
- Dragging more than 6 CSS pixels rotates immediately, including from the card title/body/padding. No long-press delay is required to drag.
- A stationary hold of at least 400 ms does not navigate when released. Holding then moving still rotates.
- Pointer capture starts only after the drag threshold; releasing outside the card cannot leave a stuck drag. Cancelled gestures do not fling or navigate.
- Vertical touch gestures continue scrolling the page. Direction buttons remain independently usable.
- Drag release and hold release must not produce a GitHub popup, but the next deliberate short click must work.

Evidence: old onPointerDown explicitly returns for any closest('a, button'); all cards are now anchors. Existing tests only covered navigation and missed gesture coexistence. Add public pointer tests first, run them red, implement gesture tracking and click suppression, then run all repository gates and visual responsive inspection. No dependencies, publishing or unrelated changes.

## Implementation and verification

Updated 2026-09-10. Changes are local and uncommitted, building on the pre-existing card-link edits. No project catalog changes in this follow-up.

- src/components/ProjectsWheel.astro: gesture state tracks primary pointer, threshold and hold duration; capture begins on drag. Click suppression distinguishes pointer activation from keyboard Enter. Window listeners handle releases outside the card; cancellation and teardown clear the gesture. Ignore bubbling lostpointercapture from a touch card when capture transfers to the stage. Native dragstart is prevented. No long-press timer or new runtime dependency.
- Side yaw sign reversed. Per-card perspective(1000px) makes opposite tilt visible while retaining the previously flattened parent required for Safari hit testing. Circular path, radius, content and dimensions are preserved. This also preserves the existing >300-line cohesive surface module: public interface remains headingLevel/immersive, with layout and gesture lifecycle private to the instance.
- tests/projects.spec.ts: four new tests cover drag from an anchor, no navigation on release, subsequent intentional clicks, stationary 500 ms hold, and hold-then-drag, on home and /projects. Durations intentionally exercise the 400 ms public hold contract.

Verification:
- Pre-fix: npx playwright test tests/projects.spec.ts --project=chromium --grep 'dragging a card|long press' — 4 failed, reproducing the bug.
- npm test — 180 passed across Chromium, Firefox, WebKit.
- After final touch-capture and perspective fixes: npx playwright test tests/projects.spec.ts — 18 passed across all engines.
- npm run check — 43 files, 0 errors / warnings / hints.
- npm run build — 9 routes passed.
- npm audit --omit=dev --audit-level=critical — 0 vulnerabilities.
- git diff --check — passed.
- Additional Chromium touch-input check at 375px: horizontal drag changed Deepulse to Codex 工作看板, one browser page retained (no popup); vertical swipe scrolled by 169px without opening GitHub.
- Normal-motion mouse drag changed selected project; 320,375,768,1024,1440px had zero document overflow. Desktop/mobile screenshots inspected, including reversed side orientation.
- P0=0, P1=0, P2=0, P3=0 identified in this delta. Residual card occlusion is the retained user-requested circular layout, not claimed fixed by drag handling. Native-device iOS long-press menu behavior has not been manually verified.
- Temporary task screenshots and browser results removed. No commit, push or deployment.
