# 源码审计修复（保留字体）

用户授权修复 2026-09-20 审计发现，明确不更换字体。当前任务不提交、不推送、不部署。GitHub main 分支保护另行确认后处理，不与本地修复混在一起。

依据 CODE_REVIEW_STANDARD.md；保留其他窗口已有未提交的项目卡片交互、数据、暖白底与移除技术区改动。

## 修复约定

- A1：About 标题组退出整组透明淡入，让文字始终以既有颜色显示；不改字体族、字号、字重、行高与排版。不削弱 axe 对比度检查。
- A2：Hero→About 监听 reduced-motion 实时变化；进入 reduce 取消帧并清除内联变换，退出时按当前位置恢复。保留原正向倾斜、CSS 参数来源与第三页覆盖。
- A3：ProjectsWheel 默认 SSR 可读列表，全部原生链接可达；仅 JS 初始化成功后启用轮盘布局/隐藏非活动项/显示方向控件。不能影响点击、拖拽、长按和触屏纵向滚动。
- A4：SiteIndex 从 navigationItems 的可选索引元数据派生，数量与图形同源；不创建第二份内容数组。
- A5/A7：About 图形联动明确定义为纯装饰 pointer hover，删除不可达 focus 分支、不添加 Tab 停靠点；统一 glyphs 命名并合并重复 CSS。
- A6：用户明确选择「本轮先修代码，分支保护等推送准备时再启用」，本轮不更改任何 GitHub 远端规则。

## 验收

先用新增回归复现 reduced-motion 切换及无脚本卡片不可达。覆盖双向偏好变化、320/375/768/1024/1440 无脚本列表、导航索引一致性、About 原字号与文字透明度。随后跑完整 check/test/build/audit/diff 门禁、浏览器视觉检查与源码复审。代码按内部 DOM/类型契约直接实现，不增加掩盖错误的默认值或宽泛 try/catch。

## 实施与审阅

- About.astro：移除标题组 data-reveal，使原文字/字号/颜色保持完全不透明；删除不可达 focusin/focusout，保留装饰性 pointer hover；合并 profile-index 声明，使用 glyphs 命名。
- ProfileGlyphs.astro：DOM 根标识统一为 data-profile-glyphs。
- HeroAboutFlow.astro / hero-about-motion.ts：将倾斜生命周期局部化为 82 行 runtime，始终注册媒体偏好变化，reduce 时取消帧并清除内联变换。脚本未挂载时面板为平面可读状态；正常脚本下角度/缩放、覆盖和暖白纸面不变。修正 Astro scoped CSS 增加的选择器优先级，使 is-readable 确实恢复 pointer-events:auto。
- ProjectsWheel.astro：SSR 默认可读网格和完整原生链接，增强成功才设置 data-wheel-enhanced 并将非活动卡移出访问树；无脚本时隐藏无效控件。保留既有点击、拖动、长按和平台兼容修正，teardown 恢复列表。
- site.ts / SiteIndex.astro / SectionGlyph.astro：导航目录增加可选 siteIndex 图形元数据，索引从目录派生数量、列数、链接和标签，图形 kind 类型同源。
- tests/audit-regressions.spec.ts：新增 13 个场景 × 3 浏览器，覆盖动态 motion、两路由五断点无 JS、索引与主导航一致、标题原字号与不透明文字。

原先的正向入场、500ms 截图交接、单书签覆盖及轮盘链接/拖拽测试不删、不放宽。ProjectsWheel 是原有深 surface，当前 689 行，公开接口仍为 headingLevel/immersive；本次仅增加真实无脚本分支，没有为一套实现创建插件层。新 motion runtime 的方法均短于 50 行，内部 DOM 由组件标记保证，使用明确非空契约而非静默兜底。

并行变更：工作中另一窗口增加首页 Logo（Hero/Nav/siteProfile.logo/public/brand/tests/logo.spec.ts），这些改动原样保留，未替其提交或回滚。

## 验证过程说明

首次 red 测试重现旧实现约 68° 无法恢复；随后两个 no-JS 用例因共享 4321 服务关闭而连接失败，不将连接失败误计为行为复现（no-JS 行为已由上轮审计实际复现）。为避开其他窗口的 dev 服务，验证使用 /tmp 临时 Playwright 配置导入原配置，仅将 baseURL/webServer 改到 4337、前台 --ignore-lock，其他测试、断言、浏览器与 retries=0 保持不变。未修改仓库 Playwright 配置。

首轮修复专项发现 is-readable 被 Astro scoped CSS 优先级压过；修正为 .motion-ready .about-flow-stage.is-readable 后复核。随后全量 219 passed / 9 failed，失败均是 Chromium 的 fonts.gstatic.com 三个既有字体文件 ERR_CONNECTION_CLOSED，trace 已确认 URL；没有改字体、字体加载方式或屏蔽 console 检查。资源恢复 HTTP 200 后，同样 9 个路由单独复测全部通过，再运行完整回归。

视觉检查：正式静态构建的 /about 桌面 1440px 中，标题仍为 Instrument Serif/serif、96px，父容器 opacity=1；375px 无脚本 /projects 显示独立卡片列表、5 个原生链接可达。没有修改原字体族、字号、字重、行高、字距或全局配色。首页客户端 JS gzip 合计约 8.7 kB，无新增依赖。

## 最终验证与交接

| 命令（网站仓库根目录） | 结果 |
| --- | --- |
| `npm run check` | 46 files，0 errors / warnings / hints |
| `npm run build` | 9 路由与 13 图片产物成功 |
| `npm audit --omit=dev --audit-level=critical` | 0 vulnerabilities |
| `npm test -- --config=/tmp/hebi-remediation-playwright.config.ts tests/site.spec.ts --project=chromium --grep 'no console error' --workers=1 --reporter=line --output=/tmp/hebi-remediation-network` | 外部字体连接恢复后，9 passed |
| `npm test -- --config=/tmp/hebi-remediation-playwright.config.ts --reporter=line --output=/tmp/hebi-remediation-verified` | 最终 228 passed (2.3m)，Chromium/Firefox/WebKit；没有跳过或修改重试次数 |
| `git diff --check` | 通过 |

临时配置导入原 playwright.config.ts，保留所有项目和断言，仅给 webServer 设置 cwd、本轮独占 4337 端口、ASTRO_DEV_BACKGROUND=0、--ignore-lock 与 reuseExistingServer=false；正式测试配置没有改动。测试结束后该配置、测试目录、截图和本轮自建 8799 静态服务已清理，其他窗口的 4321 服务没有被关闭。没有通过 mock 外部字体或忽略 console 错误获得绿色结果。

审计复核：A1/A2/A3/A4/A5/A7 的代码项已闭环，未发现本轮遗留 P0/P1/P3；唯一 P2 A6 为用户明确批准暂缓的远端分支保护，负责人为用户/后续推送准备任务，应在下一次发布准备时启用强制 Quality 检查。不能据此声称远端保护已经配置或远端 CI 已运行。

本轮改动路径：About.astro、ProfileGlyphs.astro、HeroAboutFlow.astro、新增 hero-about-motion.ts、ProjectsWheel.astro、SiteIndex.astro、SectionGlyph.astro、site.ts（只增加索引/图形元数据）、新增 tests/audit-regressions.spec.ts、本记录。保留其他窗口原有改动和并行 Logo 实现。当前仍是本地未提交状态；没有 commit/push/deploy，没有修改 GitHub 配置。真机屏幕阅读器和原生移动 Safari 手势认证不在本轮验证范围。
