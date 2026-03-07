@echo off
setlocal

if "%~1"=="" (
    set /p MESSAGE="Please enter commit message: "
) else (
    set MESSAGE=%~1
)

git add .
git commit -m "%MESSAGE%"

endlocal
