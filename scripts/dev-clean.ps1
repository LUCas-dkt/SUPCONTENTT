# Arrete Next.js sur le port 3000 et supprime le cache .next
& (Join-Path $PSScriptRoot "free-ports.ps1") -Ports @(3000)

$root = Split-Path $PSScriptRoot -Parent
$nextDir = Join-Path $root ".next"
if (Test-Path $nextDir) {
  Write-Host "Suppression du cache .next ..."
  cmd /c "rd /s /q `"$nextDir`"" 2>$null
  if (Test-Path $nextDir) {
    Remove-Item $nextDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}

Write-Host "Pret. Lancez : npm run dev" -ForegroundColor Green
