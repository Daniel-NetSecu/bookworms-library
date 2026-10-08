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

## 连续阅读与进度定位专项复核（2026-10-07）

用户要求借鉴 GitHub 同类项目。本次核对官方仓库与文档，以下是候选设计，不表示已集成：

| 项目/来源 | 借鉴重点 | 与本站的适配判断 |
| --- | --- | --- |
| [epub.js continuous 示例](https://github.com/futurepress/epub.js/blob/master/examples/continuous-scrolled.html) | 相邻章节预加载、多文档连续滚动 | 最贴近连续滚动需求。当前站是边缘滚动切换文件，并非多章节无缝拼接；后续应评估有限窗口加载，避免整本大合集驻留内存。不能直接把全合集当一本书加载。 |
| [Foliate FAQ](https://github.com/johnfactotum/foliate/blob/gtk4/docs/faq.md) | CFI 内容位置、独立于屏幕大小的进度；JSON 进度备份 | 当前 HTML 保存章节 URL 与像素滚动位置，PDF 保存页码。更稳健的改进方向是内容锚点加相对偏移，保留旧数据回退；当前不宣称已支持 CFI 或跨设备同步。 |
| [Readest](https://github.com/readest/readest) / [阅读文档](https://www.readest.com/docs/reading) | 简洁工具栏、书签、章节/全书进度、双书并排 | 参考交互；整套 Next.js/Tauri 应用不宜直接替换当前静态站。双书并排可用于双语阅读，但不等同自动段落对齐。 |

优先级建议：稳健的阅读位置恢复 → 邻章预加载与连续视口 → 可选进度百分比/书签。固定入口、现有目录与原文/译文链接保持不变。本次仅完成调研与适配判断，未引入这些项目代码或新增同步服务。

### 本轮已采用的优化
- 借鉴内容位置定位思路，保存 DOM 段落路径、文本校验与段内相对偏移；字号变化、阅读区尺寸变化和重开时优先恢复段落位置。不是 EPUB CFI，保留原像素位置兼容旧记录，PDF 页码逻辑不变。
- 借鉴邻章预加载思路，在浏览器空闲时仅用一个隐藏的禁脚本 iframe 预载下一份不同的 HTML/XHTML 文档及其资源；读到下一节时直接复用已加载的 iframe，不移动 DOM 节点，也不重新设置 src。跳过 PDF、省流量与 2G 网络；切换到其他章节会清除过时的预载 frame，尚未加载好时退回正常导航。未实现多章节同时拼接的无缝视口，也未预加载整本。
- 在章节切换、页面离开和切到后台时补写进度，清理跨文档事件监听。以上为针对本站结构独立实现，未复制上述开源应用代码，也未引入账号或同步服务。

- 线上实测发现普通 fetch/rel=prefetch 虽完成请求，iframe 导航仍重复传输，因此进一步采用上面的单文档预载与原位复用；验证重点是实际复用同一已加载 frame，而不只检查请求成功。

## 本页学习侧栏（2026-10-07）
- 用户要求在阅读区右侧显示当前页生词、词汇与语法。参考 Readest 的词典侧栏交互，采用 [ECDICT](https://github.com/skywind3000/ECDICT)（仓库 MIT 许可，保留 LICENSE/NOTICE）的常用词子集及派生词，约9万词形、5.8MB，按英文前两字母分成676份按需加载。原CSV只放本地临时目录，生成脚本为 build-study-dictionary.py；修复 snuck 自指原形数据，基础缩写用人工核对的释义。
- 桌面独立右栏，不遮住正文；小屏默认关闭，通过底栏“学习”打开可收起面板。打开状态存当前浏览器，关闭时不自动请求词库。
- PDF 使用现有 PDF.js getTextContent 获取当前物理页；普通 HTML 取当前屏幕相交文本节点（包括跨屏段落），随滚动更新。异步读取有代次检查；翻页不保留上页分析。选中文本或手动输入可查词；自动候选排除基础词、缩写及句中大写疑似专名，人工查专名时提示不要套用普通义。
- 短语与句型为明确模式匹配，展示中文学习提示与当前页原句，可展开例句。不是AI逐句解析、上下文义项消歧或全面语法分析；空文本扫描页明确提示不能提取，不假装完成OCR。书页内容不发往第三方AI/翻译服务，无新增账号或收费接口。
- 自动提示仍可能漏词或误判；词典常见义需结合语境。所有文本用 textContent 构建，书籍 iframe 不增加脚本权限。PDF 原页码、普通书续读和位置记忆保留。
