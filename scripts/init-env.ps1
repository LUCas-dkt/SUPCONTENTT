# Cree .env et .env.local si absents (ne remplace pas les fichiers existants).
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

foreach ($name in @(".env", ".env.local")) {
  $path = Join-Path $Root $name
  if (-not (Test-Path $path)) {
    if (Test-Path (Join-Path $Root ".env.example")) {
      Copy-Item (Join-Path $Root ".env.example") $path
    }
    Write-Host "Cree : $name — completez LASTFM_API_KEY et GOOGLE_* si besoin" -ForegroundColor Green
  } else {
    Write-Host "Deja present : $name" -ForegroundColor Gray
  }
}

if (-not (Test-Path (Join-Path $Root "server\.env"))) {
  @"
PORT=4000
LASTFM_API_KEY=
"@ | Set-Content (Join-Path $Root "server\.env") -Encoding utf8
  Write-Host "Cree : server\.env — copiez LASTFM_API_KEY depuis .env" -ForegroundColor Green
}

Write-Host ""
Write-Host "Demarrage : npm run db:start && npm run dev:all" -ForegroundColor Yellow
