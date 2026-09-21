# A/B 网页字体交付

用户已确认拥有网页分发授权，并要求打包。仅接入已选定的 HannotateSC-W5 / HanziPenSC-W3，不调整设计或正文。

原行为：仅 `local()`，访客未安装时回退黑体。验收：URL 加载 WOFF2，禁用本机字体后仍显示两款字体；保留现有中文覆盖范围和西文字体规则。

实现：已构建页面按实际字体用途收集常用字，其余原字库中文按 Unicode 分块，避免一次下载完整中文字库，也避免新增文章用字缺失。生成资产入库，普通构建不依赖 Mac 字体或 Python。保留原字体名称及版权元数据，授权依据为用户确认，不宣称字库开源。

来源：https://fonttools.readthedocs.io/en/latest/subset/index.html

实现文件：`scripts/package-webfonts.py`、`public/fonts/hebi/`、`src/styles/webfonts.css`、`src/layouts/BaseLayout.astro`、`src/styles/global.css`、`tests/webfonts.spec.ts`。仅替换字体交付方式，无内容、导航或布局接口变化。

初始生成结果（已被审核修复替代）：每款保留 27,640 个中文范围字符，各 31 个 WOFF2 包；常用 728 字，两包合计约 580 KiB；全部字体约 27 MiB。对每个文件重新读取 cmap，验证覆盖完整且声明范围无重叠。其余分包只在出现相应文字时加载。保持原字库能力，并不声称覆盖全部 Unicode 汉字。

后续审核发现常用包混入正文/注释用字（P2）及固定文件名的缓存混用风险（P3）。用户已批准修复；最新实现、体积和验证结果以 [webfont-audit-fixes.md](webfont-audit-fixes.md) 为准。按字体用途收集、内容哈希命名和重新生成操作见 [字体 README](../../public/fonts/hebi/README.md)。

BaseLayout 直接导入字体 CSS，由 Astro 打包；取消 global.css 的 local() 定义。浏览器开发预览在中断生成时曾缓存 CSS import 缺失错误，改为布局导入后 4322 已恢复 HTTP 200。

状态：已生成、接入并验证；不包含其他窗口的发布、提交或部署。

## 验证结果

- `npm run check`：58 files，0 errors / warnings / hints。
- `npm test -- --config /Users/mac/Documents/ChatGPT/网站/output/home-nav-tests.config.ts --workers=4`：321 passed（3.6m），三个浏览器全部通过。外部配置只切换静态测试端口、输出位置，避免占用其他窗口端口。
- 最终将 CSS 引入位置改为 BaseLayout 后，`npm test -- --config /Users/mac/Documents/ChatGPT/网站/output/home-nav-tests.config.ts tests/webfonts.spec.ts --workers=3`：3 passed（3.7s）。两次 npm test 的 pretest 均执行 `npm run build`，9 routes 构建成功。
- `npm audit --omit=dev --audit-level=critical`：0 vulnerabilities。
- `git diff --check`：通过。
- Chromium CDP `CSS.setLocalFontsEnabled(false)` 后检查实际平台字体：HannotateSC-W5、HanziPenSC-W3 均为 custom font，实际有渲染 glyph。Firefox / WebKit 验证 FontFace 加载成功、字体资源 HTTP 成功且文件为 WOFF2；额外测试不在当前文案中的「龘」分包。
- 人工检查 375 / 768 / 1440 宽度截图，字形、换行无新增异常；临时截图已移除，专用浏览器已关闭，测试日志位于仓库外。
- ZIP 约 27 MiB，`unzip -t` 完整性通过；交付 `/Users/mac/Documents/ChatGPT/网站/output/hebi-webfonts.zip`。

以上为初次交付时的验证记录，不代表后续审核没有发现问题；P2/P3 修复状态见上方链接。未修改其他窗口的代码逻辑或代为提交整份脏工作区。剩余边界：网络加载失败仍使用回退；正文系统黑体和不同系统的抗锯齿不承诺像素一致；网站发布仍由现有发布流程完成。
