param(
    [Parameter(Position=0)]
    [string]$Message
)

$ErrorActionPreference = "Stop"

function Test-Proxy {
    $proxyPorts = @("7890", "10809", "1080", "8080")
    foreach ($port in $proxyPorts) {
        $result = netstat -an | Select-String "LISTENING" | Select-String ":$port\s"
        if ($result) {
            return "http://127.0.0.1:$port"
        }
    }
    return $null
}

function Set-GitProxy {
    param([string]$proxyUrl)
    
    if ($proxyUrl) {
        git config --global http.proxy $proxyUrl 2>$null
        git config --global https.proxy $proxyUrl 2>$null
        Write-Host "[Info] Proxy configured: $proxyUrl" -ForegroundColor Yellow
        return $true
    }
    return $false
}

function Test-GitConnection {
    try {
        $result = git ls-remote origin HEAD 2>&1
        if ($LASTEXITCODE -eq 0) {
            return $true
        }
    } catch {}
    return $false
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       Git Auto Push Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$status = git status --porcelain
if ($status.Count -eq 0) {
    Write-Host "[Info] No changes to commit" -ForegroundColor Yellow
    exit 0
}

Write-Host "`n[1/5] Files to be committed:" -ForegroundColor Green
git status --short

if ([string]::IsNullOrWhiteSpace($Message)) {
    $Message = Read-Host "`nPlease enter commit message"
}
if ([string]::IsNullOrWhiteSpace($Message)) {
    $Message = "update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "[Info] Using default message: $Message" -ForegroundColor Yellow
}

Write-Host "`n[2/5] Adding files to staging area..." -ForegroundColor Green
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "[Error] git add failed" -ForegroundColor Red
    exit 1
}

Write-Host "[3/5] Committing changes..." -ForegroundColor Green
git commit -m $Message
if ($LASTEXITCODE -ne 0) {
    Write-Host "[Error] git commit failed" -ForegroundColor Red
    exit 1
}

Write-Host "[4/5] Checking network connection..." -ForegroundColor Green
$connected = Test-GitConnection

if (-not $connected) {
    Write-Host "[Warning] Cannot connect to GitHub, trying to configure proxy..." -ForegroundColor Yellow
    $proxyUrl = Test-Proxy
    if ($proxyUrl) {
        Set-GitProxy $proxyUrl
        Start-Sleep -Seconds 1
        $connected = Test-GitConnection
    }
    
    if (-not $connected) {
        Write-Host "[Error] Still cannot connect. Please check:" -ForegroundColor Red
        Write-Host "  1. Is your proxy running?" -ForegroundColor Red
        Write-Host "  2. Or run: git config --global http.proxy http://127.0.0.1:YOUR_PORT" -ForegroundColor Red
        exit 1
    }
}

Write-Host "[5/5] Pushing to remote..." -ForegroundColor Green
git push
$pushAttempts = 1

while ($LASTEXITCODE -ne 0 -and $pushAttempts -lt 3) {
    Write-Host "[Warning] Push attempt $pushAttempts failed, retrying..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    git push
    $pushAttempts++
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "[Error] Push failed after $pushAttempts attempts" -ForegroundColor Red
    Write-Host "[Tip] Try running: git push --verbose" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "       Push Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
