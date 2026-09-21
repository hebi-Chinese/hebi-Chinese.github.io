# 首屏 Logo 局部软放大

## 强度微调（2026-09-20，用户澄清“局部变得更鼓一点”）

最初误将范围增至 0.48，用户立即澄清不是扩大范围。因此半径恢复 0.43，只将 `HeroLogo.astro` 的 `--bulge-strength` 从 0.55 调至 0.60（中心局部倍率约 2.22 → 2.5）。弹簧、留边、原 Logo 和布局都不变。现有笔画增宽/移出恢复、触屏、键盘、降级与响应式测试继续覆盖这一参数微调；不增加新的行为或接口。

验证：`npm test -- tests/logo-zoom.spec.ts tests/logo.spec.ts --workers=3 --reporter=line --output=/Users/mac/Documents/ChatGPT/网站/output/playwright/logo-bulge-strength`：21 passed（24.2s，三个浏览器）；pretest 执行 `npm run build` 成功（9 routes）。`npm run check`：0 errors/warnings/hints；`npm audit --omit=dev --audit-level=critical`：0 vulnerabilities；`git diff --check`：通过。本次仅重跑 Logo 相关用例，前轮全站 WebKit 无 JS 导航问题仍未处理。本参数变动无新增 P0–P3；源码无新增临时浏览器产物。变更路径仅 HeroLogo.astro 和本记录/交接文件，架构接口无变化，未部署。

## 修订：KRAAVON 局部鼓包（2026-09-20）

用户否决叠加放大镜，明确选定 https://labs.kraavon.com/experiment/bulge-text 。
本轮只替换 HeroLogo 的渲染，不改静态 SVG、导航标志、Hero 布局及并行编辑。

- 对整张透明 Logo 做连续径向纹理重映射：指针中心附近放大，影响随距离平滑归零；内部留白和外轮廓一同形变，不叠加副本或圆形遮罩。
- 原生 WebGL 单通道渲染，不增加运行时依赖；纹理以高分辨率 SVG 光栅化，透明边缘保留预乘 alpha，留出画布外扩空间避免截断。
- 保留已有弹簧跟随、收回、键盘/触屏与停帧机制。减少动态效果时静态切换。
- WebGL 不可用/上下文丢失时恢复原图，不显示损坏或空白标志。组件销毁释放 GPU 资源。
- 回归用图像像素验证鼠标落点处笔画变宽、移动后形变位置变化、离开恢复，不以隐藏内部变量代替效果验收。
- 资料：MDN WebGL textures；Astro client-side scripts（对应当前 Astro 7.3.2）。

旧放大镜实现记录保留于下方，仅作历史，不再代表当前验收方向。

### 本轮实现与结构复核

- `HeroLogo.astro` 保留原有零参数调用接口、尺寸和辅助操作；GPU 渲染放在同目录的 `logo-bulge.ts`，页面层没有新增逻辑。正式 SVG 和顶部导航不变。
- 单一 WebGL 三角形渲染整张透明纹理；中心采样压缩为原始距离的 45%，得到约 2.22 倍的局部放大，向半径边缘连续衰减。默认半径为 Logo 宽度的 43%，不是另画一个浮层。
- 高分辨率纹理、预乘透明通道、四周 20% 留边；画布仅在有形变时可见，静止原尺寸仍用原 SVG。
- WebGL 创建/编译/恢复可失败，因此此入口允许显式平台能力检查；失败时保留原图。图片解码失败同样不启用按钮。其他内部数据直接按契约处理。
- 根实例初始化回调集中持有帧、事件及观察器，超过 50 行是既有表面模块的局部例外：其中具名函数均短小，拆成传递状态的辅助接口会降低生命周期的可审计性。渲染器创建函数小于 50 行，两个实现文件均小于 200 行。
- 当前交互构建脚本 6,032 bytes，gzip 2,646 bytes，无新增运行时依赖。
- 官方 API 依据：https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL ；https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_lose_context ；https://docs.astro.build/en/guides/client-side-scripts/ 。

### 本轮最终验证

- 修改前：`npx playwright test tests/logo-zoom.spec.ts --project=chromium --grep 'actual logo' --reporter=line --output=/Users/mac/Documents/ChatGPT/网站/output/playwright/logo-bulge-before`：预期失败，旧实现不存在连续形变画布。
- 首轮：`npx playwright test tests/logo-zoom.spec.ts tests/logo.spec.ts --workers=1 --reporter=line --output=/Users/mac/Documents/ChatGPT/网站/output/playwright/logo-bulge-focused`：15 passed。像素检查证明光标落点处左竖笔画增宽超过 1.5 倍，移到另一处/移出后还原。
- 最终全站：`npm test -- --workers=2 --reporter=line --output=/Users/mac/Documents/ChatGPT/网站/output/playwright/logo-bulge-suite`：299 passed / 1 failed（6.8m）。本轮 Logo 的 21 项检查全部通过，包括新增 GPU 不可用和上下文丢失两项、触屏、键盘、减少动态效果、停帧和5个响应式宽度。
- 唯一全站失败：`tests/section-navigation.spec.ts:62` 的 WebKit 无 JavaScript 场景。从 `/about` 重定向至首页后点击 `likes`，URL 成为 `/#likes`，但画面仍在 About，目标标题不在视口。该场景未运行 Logo 的 WebGL/事件代码；对应导航/重定向是已有并行变更，本轮未修改。根因未进一步定位，没有重试刷绿或声称全站通过。
- `npm run check`：最终 0 errors / 0 warnings / 0 hints（补充测试的 this 类型错误已修复）。
- `npm run build`：通过，9 routes；`npm test` 的 pretest 也重新完成构建。
- `npm audit --omit=dev --audit-level=critical`：0 vulnerabilities。
- `git diff --check`：通过。
- 实际浏览器查看 320/375/768/1024/1440 宽度；1440 下分别悬停手柄、羽毛球确认连续鼓包、透明背景、无硬边与重复原图；页面控制台 0 errors。截图在讨论工作区 `output/playwright/logo-bulge-*.png`。

### 本轮交付范围与剩余风险

- 接口：HeroLogo 原有调用保持不变，渲染器是组件内部模块；不增加页面逻辑或依赖。
- 变更：`src/components/HeroLogo.astro`、`src/components/logo-bulge.ts`、`tests/logo-zoom.spec.ts`、本任务记录与 `.codex/handoffs/task-hero-logo-soft-zoom.md`。
- 复核：Logo 范围未发现未处理 P0/P1/P2，P3 无记录。全站另有一个待定位 P2：上述无 JavaScript 的 WebKit 锚点导航失败；不是已经获批的豁免，因此整站发布门禁仍未通过。
- 预览可交用户确认手感；未提交、推送或部署。原 SVG、导航 Logo 与其他窗口的改动均保留。
- 源码仓库没有本轮临时浏览器文件需要清理；所有本轮截图/报告放在讨论工作区，不改/删已有 `.playwright` 目录或其他窗口的产物。

用户希望右侧大 Logo 在鼠标经过时局部放大，有柔和、略带回弹的跟随感。

## 实现范围

- HeroLogo 组件替换 Hero 的静态大图；导航 Logo 不变，正式 SVG 不改。
- 原尺寸图片保持布局，叠加圆润不规则的局部放大区域；跟随指针，弹簧缓动进入及退出。
- 原生按钮提供键盘与触屏操作：点击切换，方向键移动放大位置，Escape 收回。
- reduced-motion 直接切换静态局部放大，不运行弹簧；离屏、页面隐藏、移开后停帧；组件卸载释放监听与观察器。
- 不增加依赖。

## 验收

鼠标移动时局部内容变大且中心跟随；退出后消失；静止后无持续 rAF；键盘和触屏可用；减少动态效果有效；不影响标题与右侧索引，不出现横向溢出。

按项目规则完成 check、浏览器测试、build、audit、diff check 与实际视觉检查。

## 交付记录（2026-09-20）

- 新增 `src/components/HeroLogo.astro`：1.8 倍局部放大、不规则柔边区域、带阻尼的跟随和轻微拉伸；收敛后停止 rAF。用原生按钮提供点击锁定、方向键和 Escape 操作。无 JavaScript 时显示原图。
- `src/components/Hero.astro` 只将大 Logo 替换为组件，移除原图片尺寸规则。已有字体等并行改动全部保留。
- 新增 `tests/logo-zoom.spec.ts`，覆盖鼠标跟随/退出、键盘/减少动态效果、触屏及停帧。
- Logo 内的 pointermove/click 停止向 Hero 冒泡，避免在查看细节时同时启动背景水波纹。最初全局 rAF 检查误将水波纹计入放大动画；确认来源后修复交互耦合。
- 跟随测试以放大区域中心为准；动画展开时边缘会受半径变化影响，不适合用左边缘位移作判断。

### 验证

- 修改前 pointer 测试因页面不存在放大按钮失败，符合预期。
- 最终 `npx playwright test tests/logo-zoom.spec.ts tests/logo.spec.ts tests/navigation.spec.ts --workers=1 --reporter=line --output=/Users/mac/Documents/ChatGPT/网站/output/playwright/logo-soft-zoom-final`：18 passed（Chromium / Firefox / WebKit），包括停帧检查。
- `npm run check`：0 errors / 0 warnings，另有并行修改路由的 4 hints。
- `npm run build`：通过（npm pretest 执行，9 routes）。
- `npm audit --omit=dev --audit-level=critical`：0 vulnerabilities。
- `git diff --check`：通过。
- 1440px 鼠标放大及 375px 静态点击放大已实际截图检查。
- 全站生产测试尝试过：第一次 258 passed / 3 failed（本次测试测量问题及第三页颜色测试）；修正后复查期间其他窗口继续变更路由、导航及首页内容，第二次全站在 112 passed / 13 failed 时主动中止，未据此宣称整站通过。相关变更不在此任务中修补。

### 范围复核与产物

本次 Logo 交互范围 P0/P1/P2 未发现待修项，P3 无记录。全站发布验收需待并行变更稳定后统一运行。未提交、推送或部署。

截图与测试产物全放在讨论工作区 `output/playwright`；临时 `.codex/logo-preview.config.ts` 已删除，未遗留本次浏览器产物于源码仓库。原 SVG 资产不变。
