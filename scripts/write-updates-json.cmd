@echo off
setlocal

set SCRIPT_DIR=%~dp0
set PS_SCRIPT=%SCRIPT_DIR%write-updates-json.ps1

if not exist "%PS_SCRIPT%" (
    echo [ERROR] Không tìm thấy PowerShell script: %PS_SCRIPT%
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" %*
set EXITCODE=%ERRORLEVEL%

if %EXITCODE% NEQ 0 (
    echo [ERROR] Tạo updates.json thất bại.
) else (
    echo [OK] updates.json đã được tạo.
)

exit /b %EXITCODE%
