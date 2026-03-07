# GitHub 推送代码完整教程

## 目录

1. [前置准备](#前置准备)
2. [初始化仓库](#初始化仓库)
3. [基本推送流程](#基本推送流程)
4. [常见问题解决](#常见问题解决)
5. [高级操作](#高级操作)

---

## 前置准备

### 1. 安装 Git

- Windows: 下载 [Git for Windows](https://git-scm.com/download/win)
- Mac: `brew install git`
- Linux: `sudo apt install git`

### 2. 配置 Git 用户信息

```bash
git config --global user.name "你的用户名"
git config --global user.email "你的邮箱"
```

### 3. 配置凭证存储（避免每次输入密码）

```bash
git config --global credential.helper store
```

### 4. 生成 SSH 密钥（可选，推荐）

```bash
ssh-keygen -t ed25519 -C "你的邮箱"
```

然后将 `~/.ssh/id_ed25519.pub` 的内容添加到 GitHub → Settings → SSH Keys

---

## 初始化仓库

### 方式一：新建本地仓库推送到 GitHub

```bash
# 1. 在项目目录初始化
git init

# 2. 添加所有文件到暂存区
git add .

# 3. 提交更改
git commit -m "初始提交"

# 4. 添加远程仓库
git remote add origin https://github.com/用户名/仓库名.git

# 5. 推送到远程（首次推送）
git push -u origin master
```

### 方式二：克隆已有仓库

```bash
git clone https://github.com/用户名/仓库名.git
cd 仓库名
```

---

## 基本推送流程

### 标准三步走

```bash
# 第一步：查看修改状态
git status

# 第二步：添加文件到暂存区
git add .                    # 添加所有文件
git add 文件名               # 添加指定文件
git add src/                 # 添加整个目录

# 第三步：提交并推送
git commit -m "提交说明"
git push
```

### 完整工作流示例

```bash
# 1. 查看当前状态
git status

# 2. 查看具体修改内容
git diff

# 3. 添加修改的文件
git add .

# 4. 提交修改
git commit -m "feat: 添加新功能"

# 5. 拉取远程更新（推荐先拉取再推送）
git pull

# 6. 推送到远程
git push
```

---

## 常见问题解决

### 问题1：推送被拒绝 (non-fast-forward)

**原因**：本地分支落后于远程分支

```bash
# 解决方案：先拉取再推送
git pull origin master
git push origin master

# 如果有冲突，解决后再提交
git add .
git commit -m "解决冲突"
git push
```

### 问题2：历史不相关 (unrelated histories)

**原因**：本地和远程是完全独立的历史

```bash
# 解决方案：合并不相关历史
git pull origin master --allow-unrelated-histories --no-edit
git push -u origin master
```

### 问题3：连接超时

**原因**：网络问题或代理配置

```bash
# 检查网络连接
ping github.com

# 测试端口
Test-NetConnection -ComputerName github.com -Port 443

# 设置代理（如果有）
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 取消代理
git config --global --unset http.proxy
git config --global --unset https.proxy
```

### 问题4：权限被拒绝

**原因**：凭证无效或未配置

```bash
# 重新配置凭证
git config --global credential.helper store

# 使用 SSH 地址代替 HTTPS
git remote set-url origin git@github.com:用户名/仓库名.git
```

### 问题5：忽略文件未生效

**原因**：文件已被追踪

```bash
# 清除缓存
git rm -r --cached .
git add .
git commit -m "更新 .gitignore"
```

---

## 高级操作

### 分支管理

```bash
# 创建新分支
git branch feature-name

# 切换分支
git checkout feature-name

# 创建并切换（简写）
git checkout -b feature-name

# 推送新分支到远程
git push -u origin feature-name

# 合并分支
git checkout master
git merge feature-name

# 删除分支
git branch -d feature-name
git push origin --delete feature-name
```

### 撤销操作

```bash
# 撤销工作区修改
git checkout -- 文件名

# 撤销暂存区
git reset HEAD 文件名

# 撤销最近一次提交（保留修改）
git reset --soft HEAD~1

# 撤销最近一次提交（丢弃修改）
git reset --hard HEAD~1
```

### 查看历史

```bash
# 查看提交历史
git log --oneline

# 查看图形化历史
git log --oneline --graph --all

# 查看文件修改历史
git log -p 文件名
```

### 强制推送（谨慎使用）

```bash
# 强制推送（会覆盖远程）
git push -f origin master

# 更安全的方式（如果远程有新提交则拒绝）
git push --force-with-lease origin master
```

---

## 提交信息规范

推荐使用约定式提交：

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复bug |
| `docs` | 文档更新 |
| `style` | 代码格式调整 |
| `refactor` | 代码重构 |
| `test` | 测试相关 |
| `chore` | 构建/工具变动 |

示例：
```bash
git commit -m "feat: 添加用户登录功能"
git commit -m "fix: 修复登录页面样式问题"
git commit -m "docs: 更新README文档"
```

---

## 快速参考卡

```bash
# 日常使用
git status          # 查看状态
git add .           # 添加所有
git commit -m "msg" # 提交
git push            # 推送
git pull            # 拉取

# 查看信息
git log --oneline   # 简洁历史
git remote -v       # 远程地址
git branch -a       # 所有分支

# 紧急恢复
git reset --hard HEAD~1  # 回退版本
git reflog               # 查看操作记录
```

---

## 相关资源

- [Git 官方文档](https://git-scm.com/doc)
- [GitHub 官方教程](https://docs.github.com/cn)
- [Pro Git 电子书](https://git-scm.com/book/zh/v2)
