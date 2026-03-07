@echo off
chcp 65001 >nul
title Git Auto Push

if "%~1"=="" (
    powershell -ExecutionPolicy Bypass -File "%~dp0auto-push.ps1"
) else (
    powershell -ExecutionPolicy Bypass -File "%~dp0auto-push.ps1" -Message "%~1"
)
