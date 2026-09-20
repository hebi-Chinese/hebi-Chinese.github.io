# Restore fourth-page carousel momentum — 2026-09-20

User wants the existing circular carousel to have buffered movement and inertia again. Preserve geometry, content, reversed tilt and native click/hold/drag semantics. Do not change unrelated dirty homepage, logo or showcase work.

Current code measures velocity from only the last pointer event, resets it after a 100 ms release gap, and applies friction per frame. A final tiny/stationary event or brief release pause can erase a swipe; high-refresh displays shorten decay in wall-clock time. Previous interaction tests all use reduced motion and do not cover coast-down.

Plan: use a short window of actual movement for release velocity, gradual release-gap damping, bounded time-based exponential friction and a small follow buffer. Pressing again catches the wheel immediately; held-still, cancelled, off-screen, hidden and reduced-motion gestures do not coast. Keep native short-click navigation, suppress drag/hold activation. Native browser primitives only; no dependency/API change. The existing surface owns this cohesive motion lifecycle.

Validation: normal-motion browser tests for brief-pause release, tiny final movement, deceleration and bounded settling, catching a moving wheel and reduced motion. Retain existing link/hold/drag tests and run repository gates. Validate touch and inspect desktop/mobile surfaces.

## Implementation

Only the current task delta in src/components/ProjectsWheel.astro is modified; the earlier uncommitted no-JavaScript fallback and other homepage work remain intact. The two public props and catalog are unchanged. New coverage lives in tests/project-inertia.spec.ts.

Release speed uses actual movement samples from approximately the last 100 ms, capped at 0.007 radians/ms. A brief release gap damps momentum rather than clearing it at 100 ms; a 280 ms stationary hold stops it. Inertia integrates exponential decay with a 600 ms time constant. A 55 ms follow buffer smooths drag and coast; low speed and small residual displacement terminate the frame loop. Direction buttons use time-based easing too. New pointer-down catches movement immediately and suppresses accidental navigation while catching. The rest of the existing click/hold/drag contract is preserved.

Off-screen, hidden-document, reduced-motion and disposal paths stop motion and clear frames. During dragging/coasting the decorative hover tilt is suspended, avoiding a competing animation. The 732-line surface remains one cohesive instance-safe module with headingLevel/immersive props; its existing initialization callback is the bounded lifecycle composition exception to the function-length guideline. Motion calculations remain in short local helpers, with no new adapter seam or dependencies.

Evidence and test design: baseline brief-pause tests recorded zero post-release travel; a tiny final pointer event yielded only 0.03 px. Initial driver-side 20 ms waits stretched the supposed 160 ms flick to ~450 ms under load (recorded real pointer timestamps), so the revised swipe uses browser-paced native mouse moves with no extra sleeps. Measurement follows the centers of all five visible card geometries rather than one bounding-box edge, whose turning point can disguise real orbital movement. A fixed 30 px coast threshold later rejected a valid slower Firefox swipe under parallel load (21.24 px observed); this was an unsupported input-speed assumption. Tests instead require visible continuation above 5 px, verify deceleration and eventual idle frames, re-grabbing, deliberate hold, reduced motion and off-screen stopping.

Runtime: the existing Astro server runs on 127.0.0.1:4322, PID observed 58072. The checked-in Playwright configuration still names 4321. A temporary config imports it and changes only test base/server URL to the existing 4322 server, output directory to /tmp, and line reporter; no server was killed and no permanent config changed.

## Final verification — 2026-09-20

- npm run check: 47 files; 0 errors, warnings and hints.
- npm run build: 9 routes built.
- npm audit --omit=dev --audit-level=critical: 0 vulnerabilities.
- git diff --check: passed.
- npm test -- --config /tmp/hebi-inertia-playwright.config.ts --workers=3: 243 passed (3.0m), Chromium/Firefox/WebKit. This includes new normal-motion tests plus original navigation/hold/drag, no-JavaScript, reduced-motion, accessibility and responsive tests.
- The temporary config imported the repository Playwright config, set baseURL and webServer.url to http://127.0.0.1:4322, outputDir to /tmp/hebi-inertia-test-results, and line reporter. It has been removed after verification; run against the configured 4321 server or recreate the same URL override if the dev server is still on 4322.
- Chromium mobile touch emulation at 375px demonstrated continued movement across eight 100 ms samples after touch release; no extra browser page opened. Desktop/tablet/mobile captures inspected at 1440/768/375px; zero document overflow. Physical touch hardware and high-refresh monitors were not tested.
- Scope review: only ProjectsWheel motion code, new tests/project-inertia.spec.ts and this task record changed for this request, plus local handoff notes. Public props, data, dimensions and orbit geometry remain as they were at task start. No dependency or route changes.
- P0/P1/P2/P3 identified in this task delta: 0/0/0/0. No implementation blocker remains; subjective damping strength can be adjusted after user review. Existing unrelated dirty changes were preserved.
- Task browser contexts closed; own temporary screenshots, test results, config and diagnostic files removed. Existing unrelated test artifacts were not removed. No commit, push or deployment.

## V1.2 发布审查补充

2026-09-20 发布前全量测试中，Chromium 的“末尾 0.1px 微动后保持惯性”用例在并行负载下失败（实测 1.29px，要求 >5px）。trace 显示原滑动 8 步约 265ms，末次 0.1px 事件又耗时约 88ms；旧代码把这次微动写进短窗口的速度样本，覆盖了真实滑动速度。这是代码缺陷，不是放宽断言能解决的测试抖动。

`ProjectsWheel.astro` 现仅在相对上一个有效速度样本累计移动至少 1px 时更新采样；指针位置与布局旋转仍按实际位移更新。原测试阈值不变，修复后三浏览器惯性专项 15/15 通过。完整发布门禁结果见 Obsidian 的 Hebi Site V1.2 PRD。
