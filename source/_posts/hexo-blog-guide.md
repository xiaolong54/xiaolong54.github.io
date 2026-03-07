---
title: Hexo 博客搭建指南
categories:
  - 技术
tags:
  - Hexo
  - 博客
  - GitHub Pages
abbrlink: 529bf0e5
date: 2025-02-17 13:00:00
updated: 2025-02-17 13:00:00
---

## 前言

Hexo 是一个快速、简洁且高效的博客框架。本文将介绍如何使用 Hexo 搭建个人博客。

## 环境准备

### 安装 Node.js

前往 [Node.js 官网](https://nodejs.org/) 下载并安装 LTS 版本。

### 安装 Hexo CLI

```bash
npm install -g hexo-cli
```

## 初始化博客

```bash
hexo init my-blog
cd my-blog
npm install
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `hexo new "title"` | 创建新文章 |
| `hexo server` | 本地预览 |
| `hexo generate` | 生成静态文件 |
| `hexo deploy` | 部署到远程仓库 |
| `hexo clean` | 清除缓存 |

## 写作技巧

### Front Matter

每篇文章开头都需要 Front Matter：

```yaml
---
title: 文章标题
date: 2025-02-17 12:00:00
categories:
  - 分类名
tags:
  - 标签1
  - 标签2
---
```

### Markdown 语法

Hexo 支持 Markdown 语法，你可以使用：

- 标题：`# H1` `## H2` `### H3`
- 列表：`- 无序列表` `1. 有序列表`
- 代码：使用三个反引号包裹
- 链接：`[文字](URL)`
- 图片：`![描述](图片地址)`

## 部署到 GitHub Pages

1. 创建 GitHub 仓库，命名为 `username.github.io`
2. 安装部署插件：

```bash
npm install hexo-deployer-git --save
```

3. 修改 `_config.yml`：

```yaml
deploy:
  type: git
  repo: https://github.com/username/username.github.io.git
  branch: main
```

4. 部署：

```bash
hexo clean && hexo generate && hexo deploy
```

## 总结

Hexo 是一个优秀的博客框架，配合 GitHub Pages 可以免费搭建个人博客。希望这篇指南对你有所帮助！
