# Lance l'API media (4000) puis Next.js (3000) - un seul terminal.
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

& (Join-Path $PSScriptRoot "free-ports.ps1")

if (-not (Test-Path "$Root\server\node_modules\express")) {
  Write-Host "Installation des dependances API..." -ForegroundColor Yellow
  npm run api:install
  if ($LASTEXITCODE -ne 0) { exit 1 }
}

$apiJob = Start-Job -ScriptBlock {
  param($dir)
  Set-Location $dir
  npm run api:dev 2>&1
} -ArgumentList $Root

Start-Sleep -Seconds 3

try {
  $health = Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing -TimeoutSec 8
  if ($health.StatusCode -eq 200) {
    Write-Host "[OK] API http://localhost:4000" -ForegroundColor Green
  }
} catch {
  Write-Host "[!!] API injoignable sur le port 4000. Verifiez .env et LASTFM_API_KEY." -ForegroundColor Red
  Stop-Job $apiJob -ErrorAction SilentlyContinue
  Remove-Job $apiJob -Force -ErrorAction SilentlyContinue
  exit 1
}

Write-Host "Demarrage Next.js http://localhost:3000 (Ctrl+C pour tout arreter)..." -ForegroundColor Cyan
try {
  npm run dev
} finally {
  Stop-Job $apiJob -ErrorAction SilentlyContinue
  Remove-Job $apiJob -Force -ErrorAction SilentlyContinue
  & (Join-Path $PSScriptRoot "free-ports.ps1")
}
