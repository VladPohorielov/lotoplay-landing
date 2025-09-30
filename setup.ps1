# PowerShell helper to init project dev deps and run build
Write-Host "Installing npm dependencies..." -ForegroundColor Cyan
if (!(Test-Path package.json)) { Write-Host "package.json not found" -ForegroundColor Red; exit 1 }
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "npm install failed" -ForegroundColor Red; exit 1 }
Write-Host "Running build (JS/CSS + image conversion)..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed" -ForegroundColor Red; exit 1 }
Write-Host "Build finished. Files created: main.min.js, styles.min.css, converted images in assets/." -ForegroundColor Green
