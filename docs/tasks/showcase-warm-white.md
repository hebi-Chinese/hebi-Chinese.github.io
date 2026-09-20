# 第三页统一暖白

用户要求第三页与全站统一暖白。仅将 ProductShowcase 的纸面变量改为引用全局 `--surface-0`（当前 #faf8f4），书签沿用同一变量。保留网格、琥珀强调、阴影、截图和动效，不调整其他窗口正在修改的轮盘、技术区、数据或路由。

架构/接口不变，无依赖变化。新增颜色回归，验证纸面和书签与 body 背景一致；先证明旧颜色不符合，再改 CSS。运行仓库要求的 check/test/build/audit/diff gates，临时报告放 /tmp 并清理。不自动提交或发布。

## 验证结果 · 2026-09-10

- `npm test -- tests/showcase-color.spec.ts --project=chromium --reporter=line --output=/tmp/hebi-warm-white-red`：修改前两项预期失败，实际 rgb(240,236,228) 与全站 rgb(250,248,244) 不符。
- `npm run check`：43 files，0 errors / warnings / hints。
- `npm run build`：9 路由和 13 图片产物成功。
- `npm audit --omit=dev --audit-level=critical`：0 vulnerabilities。
- `npm test -- --reporter=line --output=/tmp/hebi-warm-white-final`：186 passed (2.7m)，三浏览器，包含手机/桌面颜色回归；无 skip/retry。
- `git diff --check`：通过。
- Playwright CLI 实看 1440×1000 / 375×844；纸面、书签、body 均为 rgb(250,248,244)，覆盖、阴影和图像保持。临时测试报告、截图及 CLI 快照复核后清理。

本次改动仅 `src/components/ProductShowcase/showcase.css` 一行，以及 `tests/showcase-color.spec.ts` 和本记录；复核本次 diff 无 P0/P1/P2/P3 遗留。其他窗口未提交的轮盘/移除技术区等改动原样保留。没有提交、推送、部署，无接口/架构变化。
