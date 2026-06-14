# Libere les ports 3000 (Next.js) et 4000 (API) avant demarrage.
param(
  [int[]]$Ports = @(3000, 4000)
)

foreach ($Port in $Ports) {
  $pattern = ":$Port\s+.*LISTENING"
  $connections = netstat -ano | Select-String $pattern
  foreach ($line in $connections) {
    $processId = ($line -split "\s+")[-1]
    if ($processId -match "^\d+$") {
      Write-Host "Arret processus $processId (port $Port)..."
      taskkill /PID $processId /F 2>$null
    }
  }
}

Start-Sleep -Seconds 2

$root = Split-Path $PSScriptRoot -Parent
$lockFile = Join-Path $root ".next\dev\lock"
if (Test-Path $lockFile) {
  Write-Host "Suppression du verrou Next.js..."
  Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
}

Write-Host "Ports liberes." -ForegroundColor Green
