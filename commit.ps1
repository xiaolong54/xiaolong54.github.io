param(
    [Parameter(Position=0)]
    [string]$Message
)

if ([string]::IsNullOrWhiteSpace($Message)) {
    $Message = Read-Host "Please enter commit message"
}

git add .
git commit -m $Message
