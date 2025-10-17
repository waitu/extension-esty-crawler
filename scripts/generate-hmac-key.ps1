Param(
    [int]$Bytes = 32,
    [string]$OutputPath,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

if ($Bytes -lt 16) {
    throw "Byte length must be at least 16"
}

if (-not $OutputPath) {
    $OutputPath = Join-Path $PSScriptRoot "hmac.key"
}

if ((Test-Path $OutputPath) -and -not $Force) {
    throw "HMAC key already exists at $OutputPath (use -Force to overwrite)"
}

$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try {
    $buffer = New-Object byte[] $Bytes
    $rng.GetBytes($buffer)
    $hex = ($buffer | ForEach-Object { $_.ToString("X2") }) -join ""
    Set-Content -Path $OutputPath -Value $hex -NoNewline
    Write-Host "HMAC key saved to $OutputPath"
}
finally {
    $rng.Dispose()
}
