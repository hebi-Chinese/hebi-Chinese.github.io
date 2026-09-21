# 导航审查修复

用户授权修复本轮审查的横屏菜单、无脚本导航门禁、项目链接类型。基线 main 1ad06ff，工作树已有大量并行变更；只调整下列局部，不提交或部署。

## 约定

- 低高度菜单有独立滚动区域，顶部避开导航按钮，首尾链接都可实际点击；保持正常竖屏排版及键盘焦点管理。
- 无 JS 导航使用可靠的原生锚点。检查初始 fragment 的原生平滑滚动与自动点击稳定性之间的竞态，不靠延长超时、强制点击或重试隐藏失败。
- Project 的 href/linkText 收紧为必填，符合现有整卡链接语义；不引入假想的不可跳转分支。
- 为横屏添加公开行为回归，保持原来的无脚本跳转断言。验证三浏览器、check、build、audit、diff check。

## 验证与结果

- Nav.astro：菜单增加 overflow-y:auto、overscroll containment、导航栏避让；首尾 auto margin 在有余量时居中，无余量时归零，链接不收缩。无 JS 的普通导航仍沿用既有横向换行布局。
- global.css：仅 html:not(.has-js) 使用即时原生锚点定位。此前初始 /#about 的 CSS 平滑滚动会与返回顶部导航的点击稳定性检查交错；字体 loaded 并不意味着滚动已结束。正常脚本下仍保留现有 560ms 分区导航与动态效果。
- site.ts：Project.href 和 linkText 改为必填，未改任何项目内容。
- tests/navigation.spec.ts：新增 667×375 横屏回归，验证首项避开固定栏、末项能通过滚动进入视口、返回首项并真实点击、跳转与焦点正确。修改前首项 viewport ratio=0，修改后 Chromium/Firefox/WebKit 通过。
- 原无脚本测试断言、超时和重试设置均未修改。导航专项 45/45 通过；额外 Chromium 三次原生点击复测均成功进入 /notes，点击 timeout=5000，无 force。
- `npm run check`：57 文件，0 errors / warnings / hints；`npm audit --omit=dev --audit-level=critical`：0 vulnerabilities；`git diff --check` 通过。
- 生产构建 9 路由及 13 图片产物通过。横屏菜单截图已人工检查。

全量回归：`npm test -- --config=/tmp/hebi-nav-fix.config.ts --workers=2`，318/318 通过（4.6m），Chromium/Firefox/WebKit，retries=0。临时配置导入仓库 Playwright 配置，仅将 preview 与 baseURL 隔离到 4356 端口，使用2 workers；测试均为正式静态构建，未 mock 网络或修改既有断言。既有并行改动保留。

最终复审：本轮三个发现已修复，无待处理 P0/P1/P2/P3；完整浏览器门禁通过。改动文件为 Nav.astro、global.css、site.ts、tests/navigation.spec.ts 及本记录。临时配置、结果目录和横屏截图已清理；没有提交、推送或部署。
