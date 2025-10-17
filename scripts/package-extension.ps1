Param(
    [string]$OutputDirectory
)

$ErrorActionPreference = "Stop"

$scriptDirectory = $PSScriptRoot
$projectRoot = Resolve-Path (Join-Path $scriptDirectory "..")
Set-Location $projectRoot

$manifestPath = Join-Path $projectRoot "manifest.json"
if (-not (Test-Path $manifestPath)) {
    throw "Không tìm thấy manifest.json tại $manifestPath"
}

$manifest = Get-Content -Raw $manifestPath | ConvertFrom-Json
$version = $manifest.version
if (-not $version) {
    throw "Không thể đọc phiên bản từ manifest.json"
}

if (-not $OutputDirectory) {
    $OutputDirectory = Join-Path $projectRoot "dist"
}

if (-not (Test-Path $OutputDirectory)) {
    New-Item -ItemType Directory -Path $OutputDirectory | Out-Null
}

$zipName = "etsy-crawler-extension-$version.zip"
$zipPath = Join-Path $OutputDirectory $zipName

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

$itemsToPack = @(
    "manifest.json",
    "assets",
    "pages",
    "popup",
    "src",
    "styles"
)

Write-Host "Đang đóng gói: $zipPath"
Compress-Archive -Path $itemsToPack -DestinationPath $zipPath -Force

$shaPath = "$zipPath.sha256"
$hash = Get-FileHash -Algorithm SHA256 -Path $zipPath
$hash.Hash | Set-Content -Path $shaPath -NoNewline
Write-Host "SHA256 được lưu tại $shaPath"

$hmacKeyPath = Join-Path $scriptDirectory "hmac.key"
$hmacPath = "$zipPath.hmac"

function ConvertFrom-HexString {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Hex
    )

    $clean = ($Hex -replace "\s", "").ToLowerInvariant()
    if (($clean.Length % 2) -ne 0) {
        throw "HMAC key phải có số ký tự chẵn (hex)"
    }

    $length = $clean.Length / 2
    $bytes = New-Object byte[] $length
    for ($i = 0; $i -lt $length; $i++) {
        $bytes[$i] = [Convert]::ToByte($clean.Substring($i * 2, 2), 16)
    }
    return $bytes
}

if (Test-Path $hmacKeyPath) {
    $keyContent = (Get-Content -Raw $hmacKeyPath).Trim()
    if ($keyContent) {
        Write-Host "Tạo HMAC từ khóa tại $hmacKeyPath"
        $keyBytes = ConvertFrom-HexString -Hex $keyContent
        $hmac = [System.Security.Cryptography.HMACSHA256]::new($keyBytes)
        try {
            $zipBytes = [System.IO.File]::ReadAllBytes($zipPath)
            $hmacHash = $hmac.ComputeHash($zipBytes)
            ($hmacHash | ForEach-Object { $_.ToString("X2") }) -join "" | Set-Content -Path $hmacPath -NoNewline
            Write-Host "HMAC được lưu tại $hmacPath"
        }
        finally {
            $hmac.Dispose()
        }
    }
} else {
    Write-Host "(Bỏ qua HMAC: không tìm thấy $hmacKeyPath)"
}

Write-Host "Đóng gói hoàn tất"
