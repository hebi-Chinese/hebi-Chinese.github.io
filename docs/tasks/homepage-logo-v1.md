# 首页 Logo v1（P3-R）

用户确认 P3-R 为第一版，要求接入第一页。

## 最新位置修正

用户明确撤回姓名旁的放置，并补充导航左上角仍要保留小 Logo。最终布局：首页导航小 Logo；姓名恢复原排版；大 Logo 位于整个 Hero 的右侧独立视觉区，站点索引放在其下。窄屏同区块堆叠到文案后，保留与下一屏的过渡空间。

## 范围与接口

- 在 public/brand 保存独立 SVG，来源为 Logo Lab 的 p3-shuttle-flow.svg。
- 只裁紧 SVG viewBox 留白，保留所有前景路径、遮罩、黑灰红配色与透明底。
- 共享身份目录 siteProfile.logo 指向此文件；首页导航用图片替换文字标识，其他路由维持文字。
- Hero 整块右侧展示较大装饰性 Logo，索引在其下；保留唯一 h1 与姓名文字，图片用空 alt 防止重复朗读。
- 不改动已有首页其他区块、项目内容、滚动动画或其他窗口的未提交修改。

## 验收

- 首页导航 Logo 可见、可加载，链接仍回首页且有可访问名称。
- Hero Logo 可见，桌面位于整块文案的右侧，宽度自适应，不遮挡姓名，不引入横向溢出。
- 375/768/1440 等响应式尺寸可用；其他路由导航仍是原文字。
- 按项目规则运行 check、全部浏览器测试、build、critical audit、diff check。

## 模块说明

Nav 与 Hero 的现有交互仍由各自模块负责；仅增加静态图像和局部布局样式，不引入客户端运行时。

## 实施与验证（2026-09-20）

修改文件：`public/brand/hebi-logo-v1.svg`、`src/data/site.ts`（仅增加 logo）、`src/components/Nav.astro`、`src/components/Hero.astro`、`tests/logo.spec.ts`、本文档。

- `npm run check`：通过，46 文件，0 errors / warnings / hints。
- `npx playwright test tests/logo.spec.ts --project=chromium`：实施前因导航无图片失败，符合预期。
- `npx playwright test tests/logo.spec.ts`：三个浏览器均通过；覆盖 320/375/768/1024/1440 宽度。
- `npm test`：208 passed / 20 failed。失败主要涉及 About 动效、无 JavaScript 项目链接、Firefox 首页 console / 项目页 axe、WebKit 项目点击；同期其他窗口正在改动相关模块，不能声明整站通过，也未为此修改或弱化测试。
- `npx playwright test tests/logo.spec.ts tests/navigation.spec.ts tests/site.spec.ts --grep 'homepage|mobile navigation|/ has one page heading|/ has no serious'`：最终尺寸调整后 18 passed，覆盖三个浏览器的 Logo、首页 console、首页 axe、移动菜单及首页内容。
- `npm run build`：通过，9 routes。
- `npm audit --omit=dev --audit-level=critical`：0 vulnerabilities。
- `git diff --check`：通过。
- 实际查看 375、768、1440 截图；桌面 Logo 缩至 96px 后与姓名同排，手机 64px，无白底框。

范围内复核未发现 P0/P1/P2；全站失败项未获发布豁免，仍是发布前阻塞，需待并行工作稳定后复核。未提交、未推送、未部署。

浏览器报告与截图保存在网站讨论工作区 `output/playwright`，本仓库本次生成的 `.playwright/report`、`.playwright/test-results` 已移出，原有用户修改保留。

## 位置修正后的验证

恢复独立姓名标题，将 Logo 置入 Hero 右列（最大 23rem），保留导航左上小 Logo。900px 以下整块顺排到文案后，并为下一屏倾斜过渡留空。

- `npm run check && npm test && npm run build`：check 0 errors / warnings / hints；228 passed；9 routes built。
- `npm audit --omit=dev --audit-level=critical`：0 vulnerabilities。
- `git diff --check`：通过。
- 1440px 实际截图确认右侧大图与左侧文案形成两栏；375px 确认顺排无横向溢出。
- Logo 测试增加桌面右侧几何位置及大图宽度断言，导航保持有名称的首页图像链接。
- 导航恢复后的 `npx playwright test tests/logo.spec.ts tests/navigation.spec.ts --reporter=line --output=/Users/mac/Documents/ChatGPT/网站/output/playwright/logo-right-focused`：6 passed。全站报告已移到讨论工作区 `output/playwright/logo-right-full-suite`，源码仓库无本次临时浏览器产物。
- 本轮改动复核 P0/P1/P2 = 0；P3 无待处理项。未提交或部署，其他窗口修改保留。
