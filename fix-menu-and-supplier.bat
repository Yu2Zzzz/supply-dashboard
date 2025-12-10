@echo off
chcp 65001 >nul
cls

echo ========================================
echo   Fix Menu and Supplier Page
echo ========================================
echo.

if not exist "src\App.jsx" (
    echo Error: Not in correct directory!
    pause
    exit /b
)

powershell -NoProfile -ExecutionPolicy Bypass -File "fix-menu-and-supplier.ps1"

echo.
echo ========================================
echo   NOW RESTART:
echo ========================================
echo   Ctrl+C to stop
echo   npm run dev to restart
echo ========================================
echo.
pause
