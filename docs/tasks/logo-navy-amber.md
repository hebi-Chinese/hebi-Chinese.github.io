# Logo 定稿配色：墨蓝主体、琥珀点缀

> 用户后续明确：这里“定稿”仅指当前网站的适配方案，不是品牌母版替换。黑灰红第一版仍是母版，所有后续卡片、网站及其他场景的版本均从母版延伸。详见 `public/brand/README.md`。

## 母版归档修订

将黑灰红原稿逐字保存为 `public/brand/hebi-logo-master-v1.svg`，不改变当前网站资产路径、显示或交互。明确 `hebi-logo-v1.svg` 是网站墨蓝/琥珀衍生版，保留其既有路径以避免无必要的接口迁移。比较页把“原稿”标成“母版”，网站用色只是场景适配。

本次归档验证：`cmp public/brand/hebi-logo-master-v1.svg /Users/mac/Documents/ChatGPT/网站/logo-color-assets/original.svg` 通过；去除颜色与title/desc后母版和网站版逐字一致；`git diff --check` 通过。仅新增母版副本与关系文档、调整实验页标签，没有改当前网站运行时代码/适配资产，未重跑浏览器套件，无新增浏览器产物。无已知新P0–P3；前述全站导航遗留项状态不变，未发布。

用户在同稿五版比较后明确选回 `navy` 原方案，不采用琥珀主体版，也不采用浅蓝与琥珀交换版。

仅更新共享资产 `public/brand/hebi-logo-v1.svg` 的六种色值及描述，使导航与首屏大图同步使用所选配色；保留资产路径与消费接口、字形路径、镂空、大小、透明背景和鼓包参数（0.60/0.43）。

所选原稿：`/Users/mac/Documents/ChatGPT/网站/logo-color-assets/navy.svg`。
黑灰红原稿保留在同目录 `original.svg`，写入前先核对它和现有生产资产逐字一致。

验收：实际资产包含深墨蓝182d43与琥珀bd7d2b，不含旧黑101010及红e52629；首屏/导航显示正常，原有Logo回归与响应式测试通过，不改其他窗口的未提交修改。不发布部署。

## 完成与验证

- 已替换共享SVG的颜色和描述；字形/遮罩/留白/尺寸逐字归一比较不变。黑灰红原稿留档核对一致。未更改组件或接口。
- `npm test -- tests/logo.spec.ts tests/logo-zoom.spec.ts --workers=3 --reporter=line --output=/Users/mac/Documents/ChatGPT/网站/output/playwright/logo-navy-final`：24 passed（23.1s，三浏览器）。新增实际SVG配色断言；原显示、布局、键盘、触屏、GPU降级及鼓包增宽测试通过。
- `npm run build` 由pretest执行：通过9路由。
- `npm run check`：0 errors/warnings/hints。
- `npm audit --omit=dev --audit-level=critical`：0 vulnerabilities。
- `git diff --check`：通过。
- 实际预览1440/375px检查、悬停鼓包可用。截图在讨论目录 output/playwright/logo-navy-home*.png；源码没有本轮临时浏览器产物。
- 变更路径：public/brand/hebi-logo-v1.svg、tests/logo.spec.ts、本任务记录/交接；讨论目录的logo-colors.html同步标注选定navy，原稿和其他试色保留。
- 本配色变更无已知未处理P0–P3；未重跑全站，前次记录的WebKit无JS导航问题不在本次修复。未提交、推送或部署。
