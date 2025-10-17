@echo off
setlocal

set SCRIPT_DIR=%~dp0
set PS_SCRIPT=%SCRIPT_DIR%package-extension.ps1

if not exist "%PS_SCRIPT%" (
    echo [ERROR] Không tìm thấy PowerShell script: %PS_SCRIPT%
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" %*
set EXITCODE=%ERRORLEVEL%

if %EXITCODE% NEQ 0 (
    echo [ERROR] Đóng gói thất bại.
) else (
    echo [OK] Đóng gói hoàn tất.
)

exit /b %EXITCODE%
