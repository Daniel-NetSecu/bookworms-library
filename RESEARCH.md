# 同类开源项目调研与采用情况（2026-10-07）

| 项目 | 借鉴/采用 | 本站落地 |
| --- | --- | --- |
| [Mozilla PDF.js](https://github.com/mozilla/pdf.js) | 成熟网页 PDF 阅读器，Apache-2.0 | 直接集成官方 v6.4.299 发行版（仓库内 vendor/pdfjs），支持页码、全文搜索、缩放、目录/缩略图；原版文字层按文件可用性呈现 |
| [Foliate](https://github.com/johnfactotum/foliate) | 阅读主题、收藏/进度与书库的交互思路 | 独立实现日夜模式、书目收藏、最近阅读排序；不复制 Foliate GPL 应用代码 |
| [KOReader](https://github.com/koreader/koreader) | 多格式统一阅读入口 | 保持 EPUB/PDF/转换后的 Word 使用同一书目入口；KOReader 面向设备的整套运行时不适合静态 Pages，未直接引入 |

## 部署与边界
- PDF.js 原始发行包：https://github.com/mozilla/pdf.js/releases/tag/v6.4.299
- 保留 PDF.js 包内 LICENSE；viewer.mjs 的 enableScripting 默认值改为 false，disablePreferences 改为 true，避免文档脚本执行与偏好覆盖。
- PDF.js 内置搜索只搜索当前 PDF；书库搜索搜索书名和章节，不宣称跨书全文搜索。
- 进度/收藏/主题只保存在当前浏览器，不跨设备同步。文本书保存章节位置；PDF 保存页码。
- 夜间模式应用于书库与 HTML/EPUB 阅读内容；PDF 保留原始纸张颜色。
- 37 份文件按 SHA-256 去重为 36 份（原输入 33 PDF、2 EPUB、1 旧 Word；网站为 32 PDF、3 EPUB、1 Word 转换文本）；按书名整理为 30 个书目。原 137 本书虫分级改写读物仍单独保留，不与名著原版误合并。
- Word 无扩展名文件已识别为 OLE DOC，用 word-extractor 转为按故事分节的 HTML；原始文件不作修改。
- IMPORT-REPORT.json 记录本次输入到书目的映射与重复项，便于复核。

- 《罪与罚》本地 PDF 截断损坏，网站替换为 Project Gutenberg #2554 的 Constance Garnett 英译版（https://www.gutenberg.org/ebooks/2554），保留来源和授权文本，原压缩包未改动。
- 新增固定翻屏按钮、键盘翻屏、触屏横向滑动和专注模式；HTML/EPUB 保存滚动位置，PDF 保存页码。
