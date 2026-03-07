$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       Git Auto Push Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$status = git status --porcelain
if ($status.Count -eq 0) {
    Write-Host "[Info] No changes to commit" -ForegroundColor Yellow
    exit 0
}

Write-Host "`n[1/4] Files to be committed:" -ForegroundColor Green
git status --short

$commitMsg = Read-Host "`nPlease enter commit message"
if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "[Info] Using default message: $commitMsg" -ForegroundColor Yellow
}

Write-Host "`n[2/4] Adding files to staging area..." -ForegroundColor Green
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "[Error] git add failed" -ForegroundColor Red
    exit 1
}

Write-Host "[3/4] Committing changes..." -ForegroundColor Green
git commit -m $commitMsg
if ($LASTEXITCODE -ne 0) {
    Write-Host "[Error] git commit failed" -ForegroundColor Red
    exit 1
}

Write-Host "[4/4] Pushing to remote..." -ForegroundColor Green
git push
if ($LASTEXITCODE -ne 0) {
    Write-Host "[Warning] Push failed, retrying..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    git push
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[Error] Push failed, please check network connection" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "       Push Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
