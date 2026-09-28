# 浏览器标签图标改用网站 Logo

## 用户决定

将旧的深底 H favicon 换成已确认的纯白底网站 Logo 版本。图形放大到接近图标边缘，沿用网站现用 Logo 的原始造型与深蓝、灰蓝、灰绿配色；品牌母版与页面内 Logo 保持原样。

## 范围与接口

- 更新 `public/favicon.svg`，保留 `/favicon.svg` 公共路径，图标自包含，不依赖外部资源。
- `BaseLayout` 与旧地址跳转页继续引用同一图标；更新引用版本以避开旧 favicon 缓存。
- 无站点目录、路由、客户端运行时、依赖或交互变更。

## 验收

- 首页及跳转页的 icon 链接指向新版本，资源可加载且是有效 SVG。
- 图标为纯白底，网站 Logo 原始颜色保留，16px 和放大预览无裁切。
- 运行项目要求的检查、跨浏览器测试、构建、依赖审计与 diff 检查。

## 实施与验证

- 更新 `public/favicon.svg`、`src/layouts/BaseLayout.astro`、`src/components/LegacyRedirect.astro`、`tests/site.spec.ts`；文档为本任务记录。无架构或运行时接口变化，图标 URL 保持 `/favicon.svg`，两处页面引用增加 `?v=2`。
- `xmllint --noout public/favicon.svg`：通过；图形与确认的预览同源，仅移除“提案”元数据。
- `npm run check`：62 文件，0 errors/warnings/hints。
- `npm test -- --reporter=line --output=/Users/mac/Documents/ChatGPT/网站/output/playwright/favicon-final`：363 passed，覆盖 Chromium、Firefox、WebKit；pretest 同时完成构建。
- `npm run build`：9 个页面构建成功；生成的首页与跳转页均引用 `/favicon.svg?v=2`，构建 favicon 与源码一致。
- `npm audit --omit=dev --audit-level=critical`：0 vulnerabilities。
- `git diff --check`：通过。按 16px 与放大尺寸检查确认图形未裁切；不同屏宽共用同一图标资源，原页面响应式检查由全套测试覆盖。
- 代码复核：P0/P1/P2/P3 无新增问题。测试结果目录已清理，源码工作区无临时浏览器产物。未改品牌母版、页面内 Logo、依赖或路由；未提交、推送或部署。
