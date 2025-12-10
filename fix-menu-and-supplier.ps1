# Fix Menu and Supplier Page Issues

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fix Menu + Supplier Page Issues" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (!(Test-Path "src\App.jsx")) {
    Write-Host "ERROR: src/App.jsx not found!" -ForegroundColor Red
    pause
    exit
}

Write-Host "Creating backup..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
Copy-Item "src\App.jsx" "src\App.jsx.backup-$timestamp" -Force
Write-Host "  Backup: src/App.jsx.backup-$timestamp" -ForegroundColor Green

Write-Host ""
Write-Host "Reading file..." -ForegroundColor Yellow
$lines = Get-Content "src\App.jsx" -Encoding UTF8

Write-Host "Applying fixes..." -ForegroundColor Yellow
Write-Host ""

$fixCount = 0

# Fix 1: Add SupplierManagementPage import
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match 'import WarehouseManagementPage from') {
        # Check if SupplierManagementPage is already imported
        $hasSupplierImport = $false
        for ($j = 0; $j -lt $lines.Count; $j++) {
            if ($lines[$j] -match 'import SupplierManagementPage') {
                $hasSupplierImport = $true
                break
            }
        }
        
        if (!$hasSupplierImport) {
            # Add import after WarehouseManagementPage
            $lines[$i] = $lines[$i] + "`nimport SupplierManagementPage from `"./pages/Supplier/index`";"
            Write-Host "  [1] Added SupplierManagementPage import" -ForegroundColor Green
            $fixCount++
        }
        break
    }
}

# Fix 2: Fix visibleItems (line 304)
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s*const visibleItems = menuItems\.filter\(item => hasRole\(item\.roles\)\);') {
        $lines[$i] = $lines[$i] -replace 'const visibleItems = menuItems\.filter\(item => hasRole\(item\.roles\)\);', 'const visibleItems = !user ? menuItems : menuItems.filter(item => hasRole(item.roles));'
        Write-Host "  [2] Fixed visibleItems (menu display issue)" -ForegroundColor Green
        $fixCount++
        break
    }
}

Write-Host ""
Write-Host "Saving file..." -ForegroundColor Yellow
$lines | Set-Content "src\App.jsx" -Encoding UTF8

Write-Host ""
Write-Host "Checking if Supplier page exists..." -ForegroundColor Yellow

if (!(Test-Path "src\pages\Supplier")) {
    Write-Host "  Creating Supplier page directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "src\pages\Supplier" -Force | Out-Null
    
    $supplierPage = @"
// src/pages/Supplier/index.jsx
import React, { useState, useEffect } from 'react';

export default function SupplierManagementPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: 调用 API 获取供应商数据
    setLoading(false);
  }, []);

  if (loading) {
    return <div style={{ padding: '40px' }}>加载中...</div>;
  }

  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '20px' }}>供应商管理</h1>
      <p style={{ color: '#64748b' }}>供应商管理页面开发中...</p>
    </div>
  );
}
"@
    
    Set-Content "src\pages\Supplier\index.jsx" -Value $supplierPage -Encoding UTF8
    Write-Host "  [3] Created Supplier page" -ForegroundColor Green
    $fixCount++
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fix Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Applied $fixCount fixes:" -ForegroundColor Green
Write-Host "  - Added SupplierManagementPage import" -ForegroundColor White
Write-Host "  - Fixed menu display issue" -ForegroundColor White
Write-Host "  - Created Supplier page (if missing)" -ForegroundColor White
Write-Host ""
Write-Host "CRITICAL: Restart dev server!" -ForegroundColor Yellow
Write-Host "  1. Press Ctrl+C to stop" -ForegroundColor White
Write-Host "  2. Run: npm run dev" -ForegroundColor White
Write-Host "  3. Refresh browser (Ctrl+Shift+R)" -ForegroundColor White
Write-Host ""

pause
