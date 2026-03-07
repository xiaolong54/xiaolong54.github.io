$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       Git 自动推送脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$status = git status --porcelain
if ($status.Count -eq 0) {
    Write-Host "[提示] 没有需要提交的更改" -ForegroundColor Yellow
    exit 0
}

Write-Host "`n[1/4] 待提交的文件:" -ForegroundColor Green
git status --short

$commitMsg = Read-Host "`n请输入提交信息"
if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "[提示] 使用默认提交信息: $commitMsg" -ForegroundColor Yellow
}

Write-Host "`n[2/4] 添加文件到暂存区..." -ForegroundColor Green
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "[错误] git add 失败" -ForegroundColor Red
    exit 1
}

Write-Host "[3/4] 提交更改..." -ForegroundColor Green
git commit -m $commitMsg
if ($LASTEXITCODE -ne 0) {
    Write-Host "[错误] git commit 失败" -ForegroundColor Red
    exit 1
}

Write-Host "[4/4] 推送到远程仓库..." -ForegroundColor Green
git push
if ($LASTEXITCODE -ne 0) {
    Write-Host "[错误] git push 失败，尝试重新推送..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    git push
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[错误] 推送失败，请检查网络连接" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "       推送完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
