# Shiloh 主题

一个为 Shiloh's Blog 定制的 Hexo 主题。深色近黑 + 青柠强调色、胶囊按钮、等宽小字点缀，
首屏是雾面背景和一张由分类、标签组成的星图。

- 纯原生实现：EJS 模板 + 手写 CSS + 原生 JS，**没有任何前端依赖**，不需要构建
- 深浅主题可切换，跟随系统偏好，选择会记住
- 本地搜索（读 `hexo-generator-search` 生成的 `search.xml`），快捷键 `Ctrl / Cmd + K`
- 文章页有跟随滚动的目录、带语言标签与复制按钮的代码块、版权声明、上下篇、相关文章

## 怎么改

日常只需要改 `_config.yml`（本目录下那份）：

| 配置 | 控制什么 |
| --- | --- |
| `menu` | 顶部导航的菜单项与顺序 |
| `brand` | 名字、字标（青柠方块里的字母）、副标题、一句话介绍 |
| `hero` | 首屏：小字、大标题（每行一句）、高亮的词、星图补充节点 |
| `social` | GitHub 地址、RSS 地址 |
| `post` | 目录开关、版权协议、相关文章数量 |
| `search` | 本地搜索开关与索引路径 |
| `footer.since` | 建站年份，显示在页脚与首屏数据条 |
| `appearance.default_mode` | `light` / `dark` / `auto`（跟随系统） |

站点标题、副标题、描述、作者、语言属于站点配置，在博客根目录的 `_config.yml` 里改。

## 目录

```
themes/shiloh/
├── _config.yml
├── layout/
│   ├── layout.ejs        页面外壳：<head>、导航、页脚、搜索弹窗
│   ├── index.ejs         首页
│   ├── post.ejs         文章页
│   ├── page.ejs         独立页面（关于、分类总览、标签云）
│   ├── archive.ejs      归档
│   ├── category.ejs     单个分类
│   ├── tag.ejs          单个标签
│   └── _partial/        公共部件：head、nav、footer、hero、post-row、pagination、icon
└── source/
    ├── css/
    │   ├── base.css     颜色变量（深浅两套）、字体、基础样式、导航、页脚
    │   ├── home.css     首屏、文章列表、分页、标签云
    │   ├── post.css     文章排版、代码块、目录、关于页
    │   └── misc.css     搜索弹窗、滚动揭示
    ├── js/
    │   ├── main.js      主题切换、菜单、目录高亮、代码复制、搜索
    │   └── stars.js     首屏星图
    └── fonts/           自托管字体（Plus Jakarta Sans、JetBrains Mono）
```

## 写模板时注意

这些是写这个主题时实际踩到的坑：

- **EJS 的 `<% %>` 里只能用 `//` 注释，不能用 `#`**。`#` 不是合法 JavaScript，模板会直接编译失败。
- **单行的 `<% // 注释 %>` 也不能写**：EJS 会把后面的页面文本拼接到这一行的末尾，被注释吞掉，导致语法错误。
  说明写在模板的 `<!-- -->` 里。
- **分页没有 `prev_link()` / `next_link()` 助手**（那是其它主题自己注册的）。直接用本地变量
  `page.prev_link` / `page.next_link`。
- **分类页、标签页里的 `page.category` / `page.tag` 只是数据对象**，上面没有文章列表。要总数，
  得到 `site.categories` / `site.tags` 里按名字找出真正的对象。
- **`url_for()` 永远只给相对路径**。要完整地址（比如规范链接），用 `full_url_for()`。
- **代码块是表格结构**（行号一格、代码一格）。要用 `table-layout: fixed` 并给行号格一个像素宽度，
  否则长行会把表格撑开。

## 换回 Butterfly

把博客根目录 `_config.yml` 里的 `theme: shiloh` 改成 `theme: butterfly`，重新生成即可。
