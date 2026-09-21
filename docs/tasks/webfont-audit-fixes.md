# 网页字体审核修复：分包体积与缓存版本

状态：已完成并验证。用户已批准修复字体审核 P2 / P3；不涉及提交、发布、字体设计或授权变更。

## 问题与验收

- P3：字体更新必须改变资源 URL。生成 WOFF2 使用内容 SHA-256 前 16 位命名；CSS 引用与实际文件内容一致，避免新 CSS 命中同名旧字库。
- P2：常用字应按实际字体用途收集，不能扫描全部源码、注释和正文后同时加入两款字体。用已构建页面的计算样式收集每款字体的文本，不手工维护字表。首页中文字体冷加载预算 100 KiB，签名字体预算 10 KiB。
- 保留每款源字体原中文范围内 27,640 字的覆盖、原名称及版权元数据。新增文案在没有重新生成常用包时也能按需下载其余分包。
- 新增浏览器回归：文件内容哈希、冷加载预算、运行时新增罕见字后的额外资源请求与真实字体渲染。先验证旧实现失败，再实施。

## 范围与接口

只修改字体生成/收集脚本、生成字体和 CSS、字体测试与交付文档。不改页面结构、排版 token、字体选择、动画及其他窗口的改动。不增加网站运行时依赖。普通构建仍不依赖 Python 或 macOS 源字体。

收集是可选的资源优化步骤：从本地生产预览读取当前构建页面，产出按字体区分的用字清单；字体生成器消费该清单。以后只更新内容时无需执行该步骤。更换源字体或希望将新增标题纳入小型常用包时，再收集并重新打包。

## 验证计划

运行 `npm run check`、全量 `npm test`（包含 pretest 构建）、`npm audit --omit=dev --audit-level=critical`、`git diff --check`。读取全部生成字体核对 cmap 覆盖与 CSS 范围。使用独立预览端口和仓库外测试输出，结束后关闭本轮服务并清理临时产物。

技术依据：[MDN unicode-range](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/unicode-range)、[fontTools subsetting](https://fonttools.readthedocs.io/en/latest/subset/index.html)。

## 实施与验证记录（2026-09-21）

- `collect-webfont-usage.mjs` 自动遍历构建后的 9 个路由（跳过重定向页），在三个宽度按计算样式区分两款字体；重复采集清单哈希相同。
- `package-webfonts.py` 只使用对应字体清单；子集写入前核对精确 cmap 和原 PostScript 名称。生成文件使用内容 SHA-256 前 16 位，关闭生成时钟对字体内容的影响。不引入站点客户端代码或依赖。
- 标题常用包 82 字、37,500 bytes；签名常用包 2 字、1,872 bytes。首页实际请求这两个文件，合计 39,372 bytes（38.45 KiB），相比原 594,628 bytes 减少 93.38%。
- 62 个分包总计 28,257,960 bytes；每款仍覆盖 27,640 字。独立读取所有字体，验证 cmap 与 CSS 声明完全一致、范围无交集、文件名哈希和原字体名称一致。
- 小型重生成实验验证：相同字形集合输出相同 URL；新增字形输出不同 URL。
- 旧实现的哈希测试失败（固定文件名），常用包预算测试失败（309,176 > 10,240 bytes）；修复后 `npm test -- --config=/tmp/hebi-font-fixes.config.ts tests/webfonts.spec.ts --workers=3` 为 12 passed（11.4s）。包含三浏览器直接插入「龘」后自动请求额外分包、不手动调用字体加载接口的验证；Chromium 禁用本机字体后确认「何必龘」三字均使用选定的自托管字体。
- `npm run check`：59 files，0 errors / warnings / hints；`npm audit --omit=dev --audit-level=critical`：0 vulnerabilities；`git diff --check`：通过。
- 全量 `npm test -- --config=/tmp/hebi-font-fixes.config.ts --workers=4`：330 passed（3.3m），Chromium / Firefox / WebKit，零重试。`pretest` 的 `npm run build` 成功构建 9 个页面、13 份优化图片。
- 人工查看 1440px About 和 375px 笔记页截图：手写标题、正文分工和换行正常，无缺字或新增溢出；本轮未调整视觉样式。
- 临时 Playwright 配置只继承项目配置并将服务切到 4356、结果写到仓库外；普通 `npm test` 仍会运行同样的测试。采集用 4357 服务已关闭，避免 Astro 7 同一仓库只能登记一个预览服务的冲突。
- 62 个原始无哈希生成文件及 62 个本轮中间哈希文件已移入废纸篓，可恢复；工作树只保留最终 CSS 引用的 62 个 WOFF2。没有删除已提交的字体资产；本次最初字体集仍处于未提交状态。未来已发布哈希版本不应套用这次未发布资源的清理策略。

新增/修改路径：`scripts/collect-webfont-usage.mjs`、`scripts/webfont-usage.json`、`scripts/package-webfonts.py`、`public/fonts/hebi/`、`src/styles/webfonts.css`、`tests/webfonts.spec.ts`、字体交付/发布文档及本记录。没有修改页面模块、排版 token 或其他窗口的业务逻辑。

剩余边界：普通内容更新不会自动重新优化常用字集合，但浏览器会自动加载其余分包，不影响字形覆盖。网络失败或源字体不支持的字符仍使用既有回退。源 TTC 和 Python 工具仅资源重新生成时需要，普通构建/发布不需要。旧交付 ZIP 属于历史产物，未重写；发布请使用本次仓库文件。

本切片最终复核：P2 / P3 已修复，无未处理的 P0–P3 新发现。不代表对其他窗口的所有未提交变更重新做了完整源码审核。未提交、推送或部署。临时配置、浏览器结果与截图已移入废纸篓；本轮 4356 / 4357 预览服务和独立浏览器均已关闭。
