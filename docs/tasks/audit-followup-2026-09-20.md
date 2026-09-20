# 审核后续：动效偏好、基础导航与惯性验证

用户已授权修复本轮审核四项问题。基线为 d546ecb；工作树干净。本轮不提交、推送或发布。

## 目标与边界

- Hero 在运行时切换 reduced-motion 时停止指针排斥和波纹、取消帧并复位；恢复偏好后交互可再次使用。保持字体与现有动效设计。
- 移动导航采用渐进增强：默认链接可用，只有实例初始化成功才展示折叠菜单按钮。无 JS 或脚本未加载时仍可访问各路由。
- 修复 ProfileGlyphs 窄屏无效的 `none scale(...)` 变换，保留减少动效下的静态表现。
- 追踪 Firefox 惯性测试实际输入与速度样本，先确认根因再修复。保留惯性、暂停释放、微小末次移动、按住停止、触屏纵滚等既有契约，不降低断言或增加重试。

## 验证

按公开行为逐项复现及修复。检查正反向偏好变化、375px 无 JS 导航、768px 图形反馈、Firefox 惯性；最后跑 check、全量三浏览器测试、build、audit、diff check。测试使用无头浏览器和独占本地端口，临时产物位于 /tmp。结束后复审并回填。

## 结果

四项完成。本轮没有新增依赖、没有修改字体、页面倾斜或第三屏浮层设计。

- Hero.astro：媒体查询保持为可监听对象，偏好/指针能力变化时清空波纹、取消帧和复位标题；事件入口读取当前偏好。修正减少动效样式优先级，标题复位也不播放过渡。
- Nav.astro：无脚本移动端默认显示可访问的普通链接，隐藏无效菜单按钮；实例全部初始化成功后才设置增强标记并启用折叠菜单。
- ProfileGlyphs.astro：窄屏直接使用 scale(1.06)，避免 none 与变换函数拼接；减少动效仍为 transform:none。
- ProjectsWheel.astro：速度采样忽略小于 2 CSS px 的尾部噪声；细小位移仍正常更新位置。Firefox 现场事件记录证实 0.1px 输入可能变成 1px，旧阈值会把它作为新的速度样本。
- tests/project-inertia.spec.ts：保留全部位移/减速/停稳断言，补入 120ms 暂停后的末次微移。时间敏感测试保留 API 事件追踪与失败截图，但关闭逐动作 DOM/视频快照。trace 证据：原 Firefox 滑动耗时约 1.3 秒，120ms 驱动等待加上记录开销让最后有效移动至释放超过运行时 280ms 阈值；不能据此扩大产品的停手容忍时间。
- tests/audit-followup.spec.ts：新增 Hero 双向实时偏好变化、无 JS 移动导航与实际链接跳转回归。

## 验证结果

- Hero 新回归先在旧实现失败（从 reduce 切回 normal 后排斥位移为 0），修复后三浏览器通过。
- 无 JS 导航新回归先在旧实现失败（about 链接不可见），修复后三浏览器通过。
- 惯性回归在旧边界复现失败，修复后 Firefox 全套惯性测试连续三轮共 15/15 通过。
- 768px 图形实测恢复 scale≈1.06；切换 reduce 后 transform:none。375px 无脚本导航截图实看：各链接可见，无横向裁切。
- `npm run check`：48 文件，0 errors / warnings / hints。
- `npm test -- --config=/tmp/hebi-fix-20260920.config.ts`：249/249 通过，Chromium/Firefox/WebKit，retries=0。临时配置只为隔离已有 Astro 服务导入原配置并改用独占 4338 端口，测试项目和断言保持不变。
- `npm run build`：9 路由、13 图片产物成功。
- `npm audit --omit=dev --audit-level=critical`：0 vulnerabilities。
- `git diff --check`：通过。

测试日志出现一次 Astro 开发工具栏 audit 的 Failed to fetch（非测试失败）；所有站点 console 断言通过，未屏蔽日志或资源。源码复审未发现本轮剩余 P0/P1/P2/P3。临时测试配置、结果及诊断截图清理；预览 Chrome 及其控制进程已关闭。没有 commit/push/deploy，已有开发服务未关闭。
