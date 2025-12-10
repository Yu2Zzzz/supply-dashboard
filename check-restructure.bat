@echo off
chcp 65001 >nul
cls

echo ========================================
echo   Restructure Verification Script
echo ========================================
echo.

set SUCCESS=0
set WARNINGS=0
set ERRORS=0

echo [Step 1/6] Checking API layer...
if exist "src\api\client.js" (
    echo   [OK] api/client.js exists
    set /a SUCCESS+=1
) else (
    echo   [ERROR] api/client.js missing
    set /a ERRORS+=1
)

if exist "src\api\orders.js" (
    echo   [OK] api/orders.js exists
    set /a SUCCESS+=1
) else (
    echo   [ERROR] api/orders.js missing
    set /a ERRORS+=1
)

if exist "src\api\index.js" (
    echo   [OK] api/index.js exists
    set /a SUCCESS+=1
) else (
    echo   [ERROR] api/index.js missing
    set /a ERRORS+=1
)
echo.

echo [Step 2/6] Checking Services...
if exist "src\services\storageService.js" (
    echo   [OK] services/storageService.js exists
    set /a SUCCESS+=1
) else (
    echo   [ERROR] services/storageService.js missing
    set /a ERRORS+=1
)

if exist "src\services\formatService.js" (
    echo   [OK] services/formatService.js exists
    set /a SUCCESS+=1
) else (
    echo   [ERROR] services/formatService.js missing
    set /a ERRORS+=1
)
echo.

echo [Step 3/6] Checking Constants...
if exist "src\constants\routes.js" (
    echo   [OK] constants/routes.js exists
    set /a SUCCESS+=1
) else (
    echo   [ERROR] constants/routes.js missing
    set /a ERRORS+=1
)

if exist "src\constants\status.js" (
    echo   [OK] constants/status.js exists
    set /a SUCCESS+=1
) else (
    echo   [ERROR] constants/status.js missing
    set /a ERRORS+=1
)

if exist "src\constants\index.js" (
    echo   [OK] constants/index.js exists
    set /a SUCCESS+=1
) else (
    echo   [ERROR] constants/index.js missing
    set /a ERRORS+=1
)
echo.

echo [Step 4/6] Checking Moved Files...
if exist "src\components\layout\Layout\index.jsx" (
    echo   [OK] Layout moved to components/layout/
    set /a SUCCESS+=1
) else (
    echo   [ERROR] Layout not moved
    set /a ERRORS+=1
)

if exist "src\routing\ProtectedRoute.jsx" (
    echo   [OK] ProtectedRoute moved to routing/
    set /a SUCCESS+=1
) else (
    echo   [ERROR] ProtectedRoute not moved
    set /a ERRORS+=1
)

if exist "src\pages\LoginPage\index.jsx" (
    echo   [OK] LoginPage reorganized
    set /a SUCCESS+=1
) else (
    echo   [ERROR] LoginPage not reorganized
    set /a ERRORS+=1
)

if exist "src\pages\SalesOrder\index.jsx" (
    echo   [OK] SalesOrder reorganized
    set /a SUCCESS+=1
) else (
    echo   [ERROR] SalesOrder not reorganized
    set /a ERRORS+=1
)
echo.

echo [Step 5/6] Checking Deleted Files...
if not exist "api.ts" (
    echo   [OK] api.ts deleted (root)
    set /a SUCCESS+=1
) else (
    echo   [WARN] api.ts still exists in root
    set /a WARNINGS+=1
)

if not exist "src\api.ts" (
    echo   [OK] src/api.ts deleted
    set /a SUCCESS+=1
) else (
    echo   [WARN] src/api.ts still exists
    set /a WARNINGS+=1
)

if not exist "src\AuthContext.tsx" (
    echo   [OK] src/AuthContext.tsx deleted
    set /a SUCCESS+=1
) else (
    echo   [WARN] src/AuthContext.tsx still exists
    set /a WARNINGS+=1
)

if not exist "src\Layout.tsx" (
    echo   [OK] src/Layout.tsx deleted
    set /a SUCCESS+=1
) else (
    echo   [WARN] src/Layout.tsx still exists
    set /a WARNINGS+=1
)

if not exist "src\ProtectedRoute.tsx" (
    echo   [OK] src/ProtectedRoute.tsx deleted
    set /a SUCCESS+=1
) else (
    echo   [WARN] src/ProtectedRoute.tsx still exists
    set /a WARNINGS+=1
)
echo.

echo [Step 6/6] Checking Config Files...
if exist ".env.example" (
    echo   [OK] .env.example created
    set /a SUCCESS+=1
) else (
    echo   [ERROR] .env.example missing
    set /a ERRORS+=1
)

if exist ".eslintrc.js" (
    echo   [OK] .eslintrc.js created
    set /a SUCCESS+=1
) else (
    echo   [ERROR] .eslintrc.js missing
    set /a ERRORS+=1
)

if exist ".prettierrc" (
    echo   [OK] .prettierrc created
    set /a SUCCESS+=1
) else (
    echo   [ERROR] .prettierrc missing
    set /a ERRORS+=1
)
echo.

echo ========================================
echo   Verification Results
echo ========================================
echo.
echo   Success:  %SUCCESS% checks passed
echo   Warnings: %WARNINGS% warnings
echo   Errors:   %ERRORS% errors
echo.

if %ERRORS% EQU 0 (
    if %WARNINGS% EQU 0 (
        echo   [STATUS] Perfect! Restructure completed successfully!
        echo.
        echo   Next Steps:
        echo   1. Update vite.config.js with path aliases
        echo   2. Update import paths in components
        echo   3. Run: npm run dev
    ) else (
        echo   [STATUS] Good! Restructure mostly successful
        echo.
        echo   Note: Some old files still exist but won't affect functionality
        echo.
        echo   Next Steps:
        echo   1. Manually delete warning files if needed
        echo   2. Update vite.config.js with path aliases
        echo   3. Update import paths in components
        echo   4. Run: npm run dev
    )
) else (
    echo   [STATUS] Issues detected! Review errors above
    echo.
    echo   Recommended Actions:
    echo   1. Check if script ran completely
    echo   2. Try running the script again
    echo   3. Or restore from backup and retry
)

echo.
echo ========================================
pause
