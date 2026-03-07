param(
    [Parameter(Position=0)]
    [string]$Message
)

if ([string]::IsNullOrWhiteSpace($Message)) {
    $Message = Read-Host "请输入提交消息"
}

git add .
git commit -m $Message
