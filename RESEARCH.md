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

## 世界双语合集的容量与去重
- 核查 GitHub 官方 [Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)：发布站点不得超过 1 GB。原发布文件约 308 MiB，不能直接发布 3.7 GB 原始 ZIP。
- 继续使用现有按章 XHTML 阅读器和 PDF.js，不引入收费存储。采用成熟的 Python `zipfile`/`lxml` 解析容器、spine、NCX，Pillow 优化图片；不以纯 OCR 替代原文字。
- 去重依据是按 spine 次序组合的正文指纹，忽略空白和“返回总目录”导航字样，而非只比较书名。原书虫已重新分页，另外比对其现有正文；5 册只有极少导航/排版差异，保留原站版本。译林、外研社等不同译本独立保留。
- 悬疑冒险套装把一份《双重人格》误标为《马丁·伊登》；正文比对后只保留正确的《双重人格》，外研社真正的《马丁·伊登》从 194 册总合集补入。
- 原 NCX 未列出的 spine 续页补入章节目录，避免目录过粗造成漏读；原版权页、译者信息和插图保留。书目级目录、全部正文链接与代表性浏览器交互分别验证。

- 全量检查发现原 EPUB 中 361 处非正文失效引用（缺失 XPGT/CSS 模板、装饰背景和出版社 XXXXXX 占位链接）；清理引用，不删除正文或插图。
- 在响应式图片优化后采用 Pillow WebP 初始 quality=68，并从本地 JPEG/PNG 备份以 quality=58 作容量细化，仅在结果更小时替换，并保持该图片像素尺寸不变；原压缩包保持完整。
