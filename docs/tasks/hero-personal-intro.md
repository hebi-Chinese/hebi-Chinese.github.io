# 首屏个人介绍简化

用户认为现有毕业/反作弊/多 Agent/模型微调介绍不适合作为个人网站的长期开场，同意调整正文与下方状态栏。按已提出的首选文案落一版，不增加未经讨论的信息。

## 范围

- 文案：写代码，打羽毛球，玩游戏，看番剧。这里放我做的东西，也放我喜欢的东西。
- 删除首屏 NOW 毕业进行中、WORKING ON Systems / Agents / Models 及其专用样式。
- 保留何必标题、项目/邮件入口、右侧 Logo 与定稿鼓包参数、索引及第二页过渡。
- 不改其他页面、共享个人资料或「当下」内容。不新增依赖、脚本与组件接口。

## 验收

新介绍可见，旧介绍/旧状态不再出现在首屏；桌面、952px 紧凑桌面及手机没有溢出；两个入口和 Logo 保持可用。更新首页文案测试，保留相关导航、Logo、移动布局覆盖。验证命令与结果于完成时补录。

## 完成记录

- 改动：`src/components/Hero.astro` 替换文案为两个自然段落行，删除状态栏标记和专用 CSS；`tests/site.spec.ts` 更新介绍及旧内容移除断言。本记录与交接作为文档变更。
- 没有接口、架构、依赖变化；现有其他窗口的字体 token、路由及布局改动完整保留。Logo 强度0.60、半径0.43未改。
- 先运行新文案测试，旧页面缺少新句子而失败；随后才应用页面变更。
- `npm test -- tests/site.spec.ts tests/logo.spec.ts tests/logo-zoom.spec.ts tests/navigation.spec.ts tests/motion.spec.ts --workers=4 --reporter=line --output=/Users/mac/Documents/ChatGPT/网站/output/playwright/hero-personal-intro`：138 passed（1.6m，Chromium/Firefox/WebKit）。包含文案、入口、页面层级、可访问性、响应式、Logo、导航键盘和原滚动动效。
- `npm run build`：由 pretest 执行通过，9 routes。
- `npm run check`：0 errors / 0 warnings / 0 hints。
- `npm audit --omit=dev --audit-level=critical`：0 vulnerabilities。
- `git diff --check`：通过。
- Playwright 实际查看1440、952、375px截图，文案换行、两侧留白及手机布局正常；控制台0 errors。产物全在讨论目录 `output/playwright/hero-intro-*.png`，源码仓库没有本轮临时浏览器产物需删除。
- 本变更复核无已知未处理P0–P3。未重跑全站全部300用例；之前另一个任务的WebKit无JS锚点导航失败未在本次修复，不宣称整站发布门禁全绿。未提交、推送、部署。
