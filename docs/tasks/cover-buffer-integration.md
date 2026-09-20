# 整页覆盖与缓冲：正式接入

## Git 与范围

用户确认独立预览 11，要求按既有代码规范升级正式站。实际仓库已有 .git、main 历史（当前 HEAD fc5ca94）、origin GitHub 远程，无需初始化。工作区大量修改尚未提交；本次不提交、推送或回滚这些改动。补充 .codex 本地记录忽略项，防止恢复记录误入版本库。

## 行为规范（替代旧的“停止滚动立即停止图片变化”约定）

- 两项同时接入：第三页完整纸面覆盖第二页；图片切换约 500 ms 缓冲。
- 第三页始终一枚书签、一张纸，不把 AOAI 做成另一页。整页继续普通滚动，不劫持 wheel，不等待动画播完。
- 第二页读完后短暂留在背面，由第三页覆盖；超高第二页先完整滚动阅读再留住。第一到第二页的正向 top-origin tilt 保持。
- 位置信号越过前向 .55 / 反向 .40 阈值后触发交接，迟滞防止边界抖动；途中反向从当前混合比例继续。缓冲时长、阈值与 responsive 参数由 CSS 提供。
- 一张不透明底图 + 上层图透明度混合，避免两图同时消失露出纸底；名称、说明和七个浮层随状态更新。
- reduced-motion / no-JS 不保留覆盖停留，内容静态可达；原生选择按钮保留。离开视口、隐藏文档与 teardown 停止帧，结束后无空闲循环。

## 架构与验收

HeroAboutFlow 增加 after-about 命名 slot，由该 surface 管理覆盖几何；页面只组合 ProductShowcase。缓冲数值状态独立于 DOM，图片绘制仍由 ProductShowcase 管理。实例内查询，AbortController/observer/rAF 明确释放，无新增依赖。

先新增覆盖回归证明旧站缺少此行为，再实现；更新过时的直接滚动淡换与无尾帧断言，不削弱 500ms 收敛、反向与无空闲循环约束。运行 check、三浏览器全部测试、build、audit 与 diff check；检查实际桌面/手机显示，记录结果。

## 最终验证（2026-09-09 本地时间）

| 命令（实际仓库根目录） | 结果 |
| --- | --- |
| `npm test -- tests/cover.spec.ts --project=chromium --reporter=line --output=/tmp/hebi-cover-red` | 实施前预期失败：第二页随页面移动 360px，不是背面覆盖 |
| `npm test -- tests/cover.spec.ts tests/motion.spec.ts tests/showcase.spec.ts --reporter=line --output=/tmp/hebi-cover-focused` | 48 passed |
| `npm test -- tests/cover.spec.ts --reporter=line --output=/tmp/hebi-cover-accessibility` | 显式 aria-hidden/inert 修正后 9 passed |
| `npm test -- --reporter=line --output=/tmp/hebi-cover-verified` | 最终 168 passed，1.5 min，Chromium/Firefox/WebKit，无跳过或重试 |
| `npm run check` | 43 files，0 errors / 0 warnings / 0 hints |
| `npm run build` | 9 路由成功，13 张优化图片产物成功 |
| `npm audit --omit=dev --audit-level=critical` | found 0 vulnerabilities，退出码 0 |
| `git diff --check` | 退出码 0 |
| `git check-ignore .codex/handoffs/task-astro-7.md` | 正确命中新增 .codex 忽略规则 |

过程中修正：覆盖位置比较先等待原 Hero→About 倾斜回到平面，避免 Firefox 下一帧变换影响测量；覆盖背面显式同时同步 aria-hidden 与 inert，并在快速回到页首时恢复可访问状态。保留最终恢复/遮挡断言，未削弱测试。

## 视觉与性能

Playwright CLI 实看正式站 1440×1000、375×844 的半覆盖状态，纸面/书签/上下层关系符合预览；小屏真实 About 高 1375px，停留 top=-531px，确保高于屏幕的内容先读完再覆盖。保留当前正式站的真实六条内容与图形，而不是复制预览里简化的第二页。前两页原倾斜测试继续通过。

浏览器采样验证快速触发后的中间透明度存在，不透明底图始终存在；再次反向从当前约 0.26 的混合比例连续返回 0，没有重新从端点播放。正常滚动过程中第三页持续上移，技术区不受动画播放限制。移动端、键盘、reduced-motion、no-JS、七个浮层、空闲帧终止仍由回归覆盖。

首页 JS（内联脚本 gzip + 输出 bundles gzip）约 8.3 kB，低于 25 kB 预算，无新增依赖。临时测试截图/trace/CLI 产物在复核后清理，不放入实际代码仓库；用户已确认的独立预览 11 保留。

## 架构审阅与路径

- `src/pages/index.astro` 只通过 `after-about` slot 组合；`HeroAboutFlow.astro` 拥有前两页与第三页的衔接，公开接口仅增加此 slot。依据 [Astro 官方命名插槽文档](https://docs.astro.build/en/basics/astro-components/#named-slots)，由 source-driven-development 核对后使用。
- `src/components/hero-about-cover.ts`：覆盖几何、超高内容停留与背面可访问性；resize/scroll/visibility/pagehide/before-swap 均有清理，无连续循环。
- `src/components/ProductShowcase/buffered-mix.ts`：与 DOM 无关的混合状态；同目标不重新计时，反向以当前值为起点。
- `src/components/ProductShowcase/runtime.ts` / `showcase.css`：500ms、迟滞阈值、不透明底图/上层混合、浮层同步，沿用原生选择按钮和 CSS 响应参数。
- `tests/cover.spec.ts` 新增，`tests/motion.spec.ts`、`tests/showcase.spec.ts` 更新已被新要求替代的断言。
- `.gitignore`：仅增加本地 agent 恢复记录忽略规则。
- 工程标准补充第二→第三页覆盖的明确例外；此任务文档与本地 handoff 保存验收依据。

模块目录是同一展示职责的深模块，拆分依据为页面几何、纯数值状态和 DOM 绘制，不引入通用插件/适配器。此次涉及的单文件均不足 300 行，新增函数不足 50 行；检查 root-scoped selectors、CSS 参数来源、清理路径及完整此次变更，没有未处理 P0/P1/P2/P3。原有其他窗口的 dirty diff 不包含在本次提交范围，也未被回滚。

限制：本地浏览器验证，不声称完成真机/完整屏幕阅读器认证或远程 CI；未新建 Git 仓库、未切共享分支、未 commit/push/deploy。真实仓库早已存在 Git 历史，但本轮及前轮尚未提交的内容仍需后续按范围整理提交，不能把本地修改误称为已进入提交历史。
