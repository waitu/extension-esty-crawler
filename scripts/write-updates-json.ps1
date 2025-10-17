Param(
    [Parameter(Mandatory = $true)]
    [string]$DownloadUrl,
    [string]$ReleaseNotes = "",
    [string]$OutputPath
)

$ErrorActionPreference = "Stop"

$scriptDirectory = $PSScriptRoot
$projectRoot = Resolve-Path (Join-Path $scriptDirectory "..")
Set-Location $projectRoot

$manifestPath = Join-Path $projectRoot "manifest.json"
if (-not (Test-Path $manifestPath)) {
    throw "Không tìm thấy manifest.json"
}

$manifest = Get-Content -Raw $manifestPath | ConvertFrom-Json
$version = $manifest.version
if (-not $version) {
    throw "Không đọc được phiên bản từ manifest.json"
}

$distDirectory = Join-Path $projectRoot "dist"
if (-not (Test-Path $distDirectory)) {
    throw "Thư mục dist chưa tồn tại. Hãy chạy scripts\\package-extension.cmd trước."
}

$zipName = "etsy-crawler-extension-$version.zip"
$zipPath = Join-Path $distDirectory $zipName
if (-not (Test-Path $zipPath)) {
    throw "Không tìm thấy gói $zipName trong dist"
}

$shaPath = "$zipPath.sha256"
if (-not (Test-Path $shaPath)) {
    throw "Thiếu file SHA256 tại $shaPath"
}

$sha256 = (Get-Content -Raw $shaPath).Trim()

$hmacPath = "$zipPath.hmac"
$hmac = $null
if (Test-Path $hmacPath) {
    $hmac = (Get-Content -Raw $hmacPath).Trim()
}

if (-not $OutputPath) {
    $OutputPath = Join-Path $distDirectory "updates.json"
}

$data = [ordered]@{
    latest = [ordered]@{
        version = $version
        url = $DownloadUrl
        sha256 = $sha256
        releaseNotes = $ReleaseNotes
    }
}

if ($hmac) {
    $data.latest.hmac = $hmac
}

$json = $data | ConvertTo-Json -Depth 5
Set-Content -Path $OutputPath -Value $json -Encoding UTF8

Write-Host "updates.json được lưu tại $OutputPath"
