# 移动端卡片审核修复

状态：已修复并验证。2026-09-21 用户批准修复独立审核发现的两项 P2；不授权提交、推送或发布。

## 验收

1. 普通动效下，快速连续按钮和键盘输入按用户请求累计目标；当前滚动位置不能覆盖未完成的目标。覆盖循环边界、反向输入、横竖屏切换和原生滑动接管。
2. 非选中卡片（含边界副本）不得被点击打开、获得焦点或暴露给辅助技术。选中卡片仍可正常触摸点击、键盘打开；原生触屏滑动不得被禁用。销毁后恢复无 JS 的可读链接。
3. 保持现有视觉、760px 切换边界、共享项目目录、原生滚动和桌面轮盘，不增加依赖或页面级状态。

## 实施边界

仅修改移动卡片 runtime、对应浏览器回归测试和修复记录。目标意图与滚动中的可见卡片状态分开；原生手势接管时解除程序滚动目标。非活动卡片使用浏览器原生 inert，先转移焦点再隐藏旧卡片。按 frontend-ui-engineering 的可访问性交互要求验证，而不是只检查属性值。

## 验证

先补测试确认旧代码失败，再逐项修复。运行三浏览器移动端专项、全量测试、Astro check、build、生产依赖审计和 diff 检查。测试产物放仓库外，结束关闭本轮预览与浏览器；保留其他窗口的改动和服务。

## 实施记录

- `mobile-project-cards.ts` 新增独立的 `requestedKey`，与当前可见 `selectedKey` 分开。连续输入按请求目标累计；完成后解除目标。边界选取最近的同项目副本，保持通常 1↔5 切换连续；resize/动效偏好变化恢复请求目标。触屏或滚轮接管时只取消仍在执行的程序滚动，不干扰普通原生滚动。
- 非选中卡片使用 `inert`，包括边界副本。先启用新活动链接并转移焦点，再隐藏旧链接，避免隐藏已聚焦元素。销毁时清除 inert，恢复完整链接列表。依据：[MDN inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert)。
- 不改组件 props、路由、项目 catalog、布局 CSS 或桌面代码；仍为一个局部交互模块，无新依赖。没有全局状态或插件抽象。
- `tests/mobile-layout.spec.ts` 新增四类公共行为回归：普通动效的键盘连发、快速按钮反向和 resize、非活动边缘的指针/程序焦点、模拟触摸边缘与中心链接点击。

## 已取得的证据

- 旧实现 `rapid keyboard` 回归失败：预期 01，实际 03；旧实现 `inactive edge` 回归失败：隐藏卡片获得焦点，预期数量 0、实际 1。
- `npm test -- --config=/tmp/hebi-mobile-fix.config.ts tests/mobile-layout.spec.ts --workers=3`：27 passed（21.7s），三个浏览器，无重试。临时配置只改端口4356及仓库外输出位置，不改变测试行为。
- `npm run check`：62 files，零错误/警告/提示。`npm audit --omit=dev --audit-level=critical`：0 vulnerabilities。`git diff --check`：通过。
- Playwright CLI 移动仿真 + Chromium 原生触摸事件：滑动 01→05→01，最终居中且回到正式卡片，弹窗数量 0；卡片截图视觉检查正常。
- 生命周期补查：`astro:before-swap` 后恢复 5 个可访问项目链接；`astro:page-load` 后重新初始化，下一张正常到 02，只有 1 个活动链接。

浏览器仿真不等同于实体 iOS/Android/微信验证，后者仍为发布前手动检查。

## 最终验收

- `npm test -- --config=/tmp/hebi-mobile-fix.config.ts --workers=4`：**357 passed（3.8m）**，Chromium / Firefox / WebKit，零重试。pretest 执行 `npm run build`，9 个静态路由构建成功。
- 最终 `npm run check`：62 files、零错误/警告/提示；`git diff --check`：通过。生产依赖审计零漏洞。
- 构建后的 5 个客户端 JS 合计 11,075 gzip bytes，低于 25 kB 项目预算。
- 本次两个 P2 均关闭；修复范围复核无未处理 P0–P3。没有改变组件公共接口、视觉样式、共享数据或桌面逻辑。
- 本轮实际修改 `src/components/mobile-project-cards.ts`、`tests/mobile-layout.spec.ts`、本记录与 `docs/tasks/mobile-v1.4.md` 的后续说明；其余已有脏工作区改动保留。
- 未提交、推送、部署。临时配置、测试结果和截图已移入废纸篓；本轮独立浏览器与4356预览服务已关闭，其他窗口的服务未操作。
