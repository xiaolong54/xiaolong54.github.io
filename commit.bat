@echo off
setlocal

if "%~1"=="" (
    set /p MESSAGE="请输入提交消息: "
) else (
    set MESSAGE=%~1
)

git add .
git commit -m "%MESSAGE%"

endlocal
