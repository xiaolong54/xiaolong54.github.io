@echo off
chcp 65001 >nul
title Git 自动推送
powershell -ExecutionPolicy Bypass -File "%~dp0auto-push.ps1"
pause
