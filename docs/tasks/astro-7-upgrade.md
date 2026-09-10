# Astro 7 安全升级

## 授权与目标

2026-09-09 用户在 Astro 跨版本升级询问后回复「提升」，按上下文确认升级。将当前 Astro 5.18.2 升到 npm 发布的稳定版 7.3.2，清除依赖安全门禁阻碍，保留全部页面、内容 URL、第三页单书签动效及其他窗口未提交更改。仅本地实施，不 commit/push/deploy。

## 实施前证据与迁移范围

- 当前 package.json 为 `astro: ^5.7.0`，lockfile 实装 5.18.2。前轮 153 个三浏览器测试通过，但 critical audit 失败（1 critical / 3 high / 1 low）。
- npm 元数据：Astro 7.3.2 要求 Node >=22.12.0 / npm >=9.6.5。本机 Node 24.18.0 可用；两个本地 CI YAML 仍为 Node 20，须同步到 Node 24。
- 读取官方 [v6 迁移](https://docs.astro.build/en/guides/upgrade-to/v6/) 与 [v7 迁移](https://docs.astro.build/en/guides/upgrade-to/v7/)：检查 Node/Vite/Zod、Rust 编译器严格 HTML、默认 Markdown 处理器与空白行为变化。
- 本站已有 glob loader / `astro/zod` / `render(entry)`；无 SSR adapter、Vite 自定义插件、旧 Astro.glob、旧 ViewTransitions 或实验配置。保持静态输出，不引入服务端。
- package 与 lockfile 通过 npm 正常安装更新；只做必要兼容修正，不用 `audit fix --force`、不削弱审计阈值。

## 验收与回归

- `npm ci` 可重现安装；类型检查、全部三浏览器测试、9 路由静态构建通过。
- critical 与完整 audit 均检查；不能把「没有 critical」误称为没有漏洞。
- 保留 Markdown 内容/日期/图片、导航与第三页连续滚动；如新默认值引发回归，以最小兼容配置修复并记录依据，不修改用户文案或削弱测试。
- 本地服务重启到新版本；所有临时测试产物放到临时目录并在验证后清理。
- 检查完整本次升级 diff；记录 P0–P3、准确命令、路径与剩余风险。

## 验证记录

本地迁移完成。2026-09-09 的最终结果如下（在仓库根目录执行）：

| 命令 | 结果 |
| --- | --- |
| `npm install` | Astro 7.3.2 安装成功；还剩锁定的 SVGO high |
| `npm update svgo` | SVGO 4.0.2 → 4.1.0；不加 override，不使用 force |
| `npm ci` | 根据 lockfile 重装成功，270 packages，0 vulnerabilities |
| `npm run check` | 40 files，0 errors / 0 warnings / 0 hints |
| `npm test -- --reporter=line --output=/tmp/hebi-astro7-s1mJNz/tests` | 159 passed，1.7 min，Chromium/Firefox/WebKit，无 skip/retry |
| `npm run build` | 9 个静态路由、13 个优化图片产物成功 |
| `npm audit --omit=dev --audit-level=critical` | 退出码 0，found 0 vulnerabilities |
| `npm audit` | 包括开发依赖，退出码 0，found 0 vulnerabilities |
| `git diff --check` | 退出码 0 |
| `npm ls --depth=0` | 依赖树有效：Astro 7.3.2，其余四个直接开发依赖版本不变 |

本轮升级前重新审计时已变为 6 个问题（1 critical / 4 high / 1 low，新增 smol-toml high），升级后全部清除。最终重要间接依赖：Sharp 0.35.4、SVGO 4.1.0、js-yaml 4.3.2、smol-toml 1.8.0、Vite 8.2.2、Zod 4.6.1。完整审阅 lockfile 版本差异，所有 resolved 主机仍为 registry.npmjs.org，保留跨平台 optional 包；条目由 453 降为 369，主要是 Astro 编译/Markdown 管线变化。

## 实际兼容修正

1. `.nvmrc` 为 Node 24，两份 workflow 都读取它；package engines 保留框架要求的最低版本。setup-node 的 [node-version-file 官方说明](https://github.com/actions/setup-node/blob/v4/docs/advanced-usage.md#node-version-file) 支持这个配置。没有改权限、触发器或质量门禁。
2. `compressHTML: true` 保留原有行内空白。依据 [Astro 7 空白迁移说明](https://docs.astro.build/en/guides/upgrade-to/v7/#new-default-whitespace-handling-compresshtml-jsx)，没有改用户文字或批量添加空格。
3. 首次全量测试在执行用例前出现 webServer exited early：Astro 7 自动识别 AI 环境并启动后台进程，原启动命令成功退出，Playwright 因失去子进程而判失败。通过本地 CLI 源码及 [官方后台模式文档](https://docs.astro.build/en/guides/build-with-ai/#background-mode) 定位；仅给 Playwright webServer 设置 `ASTRO_DEV_BACKGROUND: '0'`。停止该后台实例后，从无运行服务状态重新启动测试，159 项全部通过。不是靠预先启动服务或削弱断言绕过问题。
4. 新增 `tests/content-rendering.spec.ts`：覆盖文章三张本地图片、两处嵌入 HTML 图注、末段中文、笔记四个标题、三处强调及时间属性。默认 Sätteri 管线保留这些内容，不需要额外引入旧 remark 依赖。

## 视觉与运行证据

使用 Playwright CLI 检查 `astro preview` 的实际构建产物：1440px 第三页截图加载后，双棱镜完整界面与浮层正常；375px 文章标题、正文排版正常。第一张快速抓帧发生在 lazy 图片完成前，后续明确等待 complete/naturalWidth 后复查成功，未把加载中截图当作回归。三浏览器测试同时覆盖两产品、响应式 320/375/768/1024/1440、减少动态效果、空闲帧终止、正反滚动和键盘入口。

首页内联脚本 gzip 加输出 JS bundles gzip 共 7453 bytes（升级前 7701），仍低于 25 kB 预算。没有修改任何 `src/` 下的页面、样式或动效逻辑。

临时 preview 4322 已停止；本地 dev 已恢复到 Astro 7.3.2，`http://127.0.0.1:4321/_astro/status` 返回 `{"ok":true}`。检查结束后清理本轮临时目录、截图和浏览器产物，不删除用户原图、旧原型或其他窗口资产。

## 变更路径与审阅

- `package.json` / `package-lock.json`：框架与兼容依赖更新，添加最低 Node/npm 声明。
- `.nvmrc`、`.github/workflows/{quality,deploy}.yml`、`CONTRIBUTING.md`：统一本地和 CI Node 版本。
- `astro.config.mjs`：仅保留旧空白策略。
- `playwright.config.ts`：测试子服务使用前台进程。
- `tests/content-rendering.spec.ts`：新增内容管线回归测试。
- `docs/tasks/astro-7-upgrade.md`、原作品展示记录、工程标准的历史漏洞迁移指针与本地 handoff：关闭旧阻碍，保留历史证据。

本次升级 diff 审阅：P0=0，P1=0，P2=0，P3=0；前轮 dependency audit 发布阻碍已消除。原有 dirty-worktree 页面改造不回滚、不覆盖，也不声称重新认证其他窗口全部设计决策。未新增 >300 行模块或 >50 行函数。

边界：本机 Node 24.18.0 / macOS 验证通过；没有远程执行 GitHub Actions、Linux 真机或真实部署验证。npm 报出 esbuild/fsevents 安装脚本待许可提示，但安装、编译和浏览器运行均成功；未放宽全局脚本许可。`npm audit` 的零漏洞结论只代表本次查询的已知公告。没有 commit/push/deploy。
