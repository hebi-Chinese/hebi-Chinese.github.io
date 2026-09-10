# 首页第三页：单页作品展示

> 后续动效：用户确认预览 11 后，正式站已按 [整页覆盖与缓冲规范](cover-buffer-integration.md) 接入第二页背面停留及 500ms 缓冲。本文早期“无停止后补间”与直接位置淡换描述由该记录替代。

> 后续状态：用户授权的 [Astro 7 升级](astro-7-upgrade.md) 已完成，159 项回归通过，完整 npm audit 为 0 vulnerabilities。本文保留接入当时的阻碍与验证记录，不再代表当前发布门禁失败。

## 需求与边界

用户确认 `third-page-icon-float-preview.html` 后要求接入实际网站。替换首页 CurrentReel 的组合位置；保留 Hero/About Forward-Tilt、技术区、项目轮盘和其他窗口的未提交更改。不提交、不发布、不升级依赖。

一张暖色网格纸、一枚 WORK / 03 书签、固定「做过的东西」标题。普通文档滚动中，双棱镜与 AOAI 在同一个截图位置淡换，产品名称和说明同步变化。没有 sticky、滚动劫持、双页覆盖、切块或停止滚动后的补间。双棱镜的 Logo、我/她、发送箭头、角色选择与 AOAI 的声纹档案、声波、开始转写共七个装饰性浮层保留。

## 架构

- 首页仅替换组件；新 ProductShowcase 深模块拥有标记、CSS、滚动生命周期与装饰 SVG。
- site.ts 增加独立的 typed showcase catalog，不改变五个现有项目的身份/计数。
- 使用用户提供的截图，Astro Image 生成响应式 WebP；SVG/CSS 浮层重绘，不提取新的位图，不接入产品业务。
- 状态按 stable key，实例内查询；ARIA 标识每实例唯一。原生产品选择按钮提供键盘/触屏可达入口。
- 单次 rAF 合并滚动输入；无惯性循环。IntersectionObserver、隐藏页、reduced-motion、pagehide、Astro swap 均有暂停/清理路径。
- 无 JS 时两件作品静态可读；减少动态效果时使用同一槽位的原生选择按钮，关闭滚动淡换/浮层。小屏保留整图与字号正常的产品说明，关闭难辨认的注释浮层。
- 响应式滚动参数由组件 CSS custom properties 提供，JS 不重复断点。

## 验收

1. 正反向滚动同位淡换；只有一枚书签，页面本身持续向上移动，后续技术区无需完成播放即可进入。
2. 七个浮层与所属图片一起淡出/浮起；不进入无障碍树、不接受焦点。
3. 双产品都能通过键盘选择，非活动内容退出无障碍树。
4. 320/375/768/1024/1440 无横向溢出；no-JS/reduced-motion 完整可读，空闲无动画循环。
5. check、三浏览器测试、build、critical audit、diff --check 均验证；记录完整 diff 审阅与现存风险。

## 实施前证据

现有首页仍引用 CurrentReel，仅有反作弊/多 Agent/模型微调文本，没有双棱镜和 AOAI 截图、单书签或七个浮层。新增公开行为测试先运行以证明缺失。

## 验证记录

2026-09-09：本地接入及行为验证完成；仓库发布门禁因既有依赖 critical 漏洞未通过，不能标记为可合并/可发布。

| 命令（仓库根目录执行） | 结果 |
| --- | --- |
| `npm test -- tests/showcase.spec.ts --project=chromium --reporter=line --output=/tmp/hebi-showcase-red` | 实施前预期失败：页面缺少书签与产品入口 |
| `npm run check` | 最终 39 files，0 errors / 0 warnings / 0 hints |
| `npm test -- --reporter=line --output=/tmp/hebi-showcase-final` | 最终 Chromium/Firefox/WebKit 合计 153 passed，2.4 min |
| `npm run build` | 9 个静态路由成功，响应式图片生成成功 |
| `npm audit --omit=dev --audit-level=critical` | 退出码 1：1 critical、3 high、1 low，详见下方阻碍 |
| `git diff --check` | 退出码 0，无空白错误 |

测试报告使用命令行覆盖输出目录，未修改测试配置。首次全量测试发现 Firefox 的异步 IntersectionObserver 回调尚未呈现中间态，测试便开始测量静止状态；修正为等待字体与可观察的实际中间态，再测量 250 ms 安静窗口。随后专项 3/3 和完整 153/153 通过，无重试或跳过。类型检查亦修正测试 locator 的 HTMLImageElement 类型收窄。

## 视觉、性能与源码依据

- 使用 Playwright CLI 真实浏览器观察桌面双棱镜四个浮层、1024px AOAI 三个浮层、375px 静态小屏编排及继续进入技术区；正反向滚动与同位几何/单书签通过自动化验证。
- 五个宽度 320/375/768/1024/1440 的截图均完成加载、无横向溢出、两图几何占位一致。键盘选择、两个活动态 axe、no-JS、reduced-motion 及偏好切换、空闲帧终止均有回归覆盖。
- 没有 sticky/fixed、wheel preventDefault、长滚动占位或时间补间；单次 scroll→rAF→render。页面自然向上移动；标题不换位，图片/产品名/说明同组透明度变化。
- Astro 实装版本 5.18.2：核对本地 `node_modules/astro/components/Image.astro` 并采用官方 [Image 文档](https://docs.astro.build/en/guides/images/) 的导入资产、显式 sizes/widths、WebP、lazy 与固有尺寸；按 [脚本与事件文档](https://docs.astro.build/en/guides/client-side-scripts/#handle-onclick-and-other-events) 做一次打包、实例内查询与初始化。
- 两图 640px WebP 约 6/11 kB，1920px 约 34/58 kB；原始 PNG 约 381/892 kB 留作本地构建输入。
- 动效 client bundle gzip 2.12 kB；当前首页内联脚本 gzip 加两个输出 JS bundle gzip 合计 7701 bytes，低于 25 kB 预算。未添加依赖，未修改 package.json/lockfile。

## Deep-module 与最终审阅

ProductShowcase 的公开接口为无 props 的 Astro 组件。约 338 行组件目录按真实职责分为 SSR/图片标记、装饰 SVG/CSS、坐标数据、纸张排版、154 行状态生命周期；单文件均不足 300 行，函数均不足 50 行。没有适配器、全局状态库或页面内动效逻辑。通过 WeakMap 防重复初始化、UUID ARIA id、root-scoped selectors、每实例 AbortController/observers/rAF，避免多实例状态和 ID 冲突。全局 Astro page-load 注册持续用于重新挂载，在非 bfcache pagehide 释放；实例在 before-swap 释放。

审阅了工作区完整 tracked diff 和本次新增文件，区分既有未提交视觉改造与本次替换。既有 Hero/About、项目轮盘、导航、路由与 CSS 文件没有被本次重写。CurrentReel 源文件及 currentSignals 是既有未提交历史方案，保留文件、不再从首页引用，以避免擅自删除其他窗口资产。

- 本次动效实现：未发现遗留 P0/P1/P2/P3 问题；曾发现的测试首帧竞态和图片类型问题均已修正。
- 仓库级发布阻碍（P1）：当前 Astro 5.18.2 落入 [GHSA-26w7-cxv4-gfx2](https://github.com/advisories/GHSA-26w7-cxv4-gfx2) 的受影响范围，审计判 critical。官方公告指恶意 AVIF 优化可触发执行，修复版本 7.2.8 要求 Sharp 0.35.4。此次仅处理用户提供的两张本地 PNG、输出 WebP，未增加远程图片或上传入口；这不是绕过仓库 critical 门禁的豁免。
- 其他 high/low 仍由原依赖树带入。未执行 audit fix、强制升级或修改 CI 审计阈值。需用户另行授权 Astro 跨版本迁移，处理审计后重跑所有门禁。
- 非自动化限制：没有声称真机触控、VoiceOver/NVDA 全流程或恶意 AVIF 利用验证；未发布。

## 本次变更路径

- `src/pages/index.astro`：CurrentReel 替换为 ProductShowcase，其他组合不变。
- `src/data/site.ts`：增加 showcaseProducts typed catalog，保留原项目/档案数据。
- `src/assets/showcase/{shuang-leng-jing,aoai}.png`：用户提供的本地截图副本。
- `src/components/ProductShowcase/{ProductShowcase.astro,FloatObject.astro,runtime.ts,objects.ts,showcase.css,objects.css}`：完整 surface。
- `tests/{showcase,motion,site}.spec.ts`：新增公开行为、替换旧 reel 断言。
- `docs/tasks/homepage-product-showcase.md` 与 `homepage-editorial-depth.md`：需求、验证和旧方案 superseded 指针。
- `.codex/handoffs/`：本地恢复记录，不用于提交。

## 交接

实际仓库 `/Users/mac/Documents/调研/hebi-chinese.github.io`；独立原型工作区 `/Users/mac/Documents/ChatGPT/网站` 未作为网站源文件编辑目标。本地 dev 服务 `http://127.0.0.1:4321/` 可查看集成后的首页第三页。未 commit/push/deploy。

本轮测试目录和四张临时检查截图在复核后清理；既有预览 HTML、用户原图和其他窗口的报告不删除。后续优先让用户查看首页效果；依赖升级需单独确认，不能把本次本地接入误报为全门禁完成。
