# Verifie web (3000) + API (4000).
param(
  [string]$WebUrl = "http://localhost:3000",
  [string]$ApiUrl = "http://localhost:4000"
)

$ok = $true

try {
  $health = Invoke-WebRequest -Uri "$ApiUrl/health" -UseBasicParsing -TimeoutSec 8
  if ($health.StatusCode -eq 200) {
    Write-Host "[OK] $ApiUrl/health" -ForegroundColor Green
  } else {
    Write-Host "[!!] $ApiUrl/health -> HTTP $($health.StatusCode)" -ForegroundColor Red
    $ok = $false
  }
} catch {
  Write-Host "[!!] $ApiUrl/health injoignable - lancez npm run api:dev" -ForegroundColor Red
  $ok = $false
}

$routes = @("/auth/login", "/auth/sign-up", "/search")
foreach ($route in $routes) {
  $url = "$WebUrl$route"
  try {
    $code = (Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15).StatusCode
    if ($code -eq 200) {
      Write-Host "[OK] $url" -ForegroundColor Green
    } else {
      Write-Host "[!!] $url -> HTTP $code" -ForegroundColor Red
      $ok = $false
    }
  } catch {
    $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { "ERR" }
    Write-Host "[!!] $url -> $code" -ForegroundColor Red
    $ok = $false
  }
}

if (-not $ok) {
  Write-Host ""
  Write-Host "Demarrage recommande:" -ForegroundColor Yellow
  Write-Host "  npm run db:start"
  Write-Host "  npm run dev:all"
  exit 1
}

Write-Host ""
Write-Host "Web et API OK." -ForegroundColor Green
