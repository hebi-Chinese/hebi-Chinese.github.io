# 发布香港导航 Note

## 目标与范围

作者已确认《在香港，百度地图把我绕晕了》的四段口述整理稿，并明确要求作为 Note 发布到个人网站。

- 将确认稿原样加入 `src/content/notes/hong-kong-baidu-maps.md`，出版日期为 2026-10-14（作者当前日历日期，America/Los_Angeles）。
- 稳定页面为 `/notes/hong-kong-baidu-maps/`，沿用现有 Notes 内容集合、路由、日期工具和布局，由列表自动发现。
- 保留标题、全部四段、标点、尚未亲自使用 Google 地图的说明，以及港理工经历的收尾，不添加旅游建议、地图比较、引用或个人经历。
- 不改变页面设计、架构、接口、目录身份、交互、依赖或发布流程。

## 验证与上线

- 新路由加入页面响应、唯一 h1、控制台、溢出、WCAG 2.1 AA 和 320/375/768/1024/1440 px 三浏览器矩阵。
- 核对列表入口、日期与四段正文，检查手机、平板、桌面排版及键盘返回与减少动画下的可读性。
- 执行 `npm run check`、`npm test`（其 pretest 执行 `npm run build`）、`npm audit --omit=dev --audit-level=critical`、`git diff --check`。
- 核对标题和正文与写作目录确认稿逐字相同。完整差异复核和验证结果保存在本次 PR 与本地交接记录中，待检查通过后合并 main，验证 Pages 部署与线上内容。
- 临时浏览器检查文件和测试产物放到任务自建 `/tmp` 目录，结束后关闭临时浏览器及预览，不向仓库提交任何生成文件。

## 既有依赖维护

本次没有依赖变化。若审计仍报告既有非 critical 告警，沿用 [既有适用性分析与维护项](note-creative-atmosphere.md#existing-dependency-advisory-follow-up)，并在 PR 中如实记录本轮结果：网站输出为静态文件，新增的是作者已确认的纯文本，没有 SSR、上传或新外部输入。不得把本次发表文章报告为已修复依赖漏洞。
