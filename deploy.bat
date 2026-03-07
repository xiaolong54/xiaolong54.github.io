@echo off
echo 正在生成静态文件...
call hexo clean
call hexo generate
echo 正在部署到 GitHub...
call hexo deploy
echo 部署完成！
