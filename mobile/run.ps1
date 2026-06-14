# Lance l'app mobile sans dependre du PATH systeme.
param(
  [string]$WebAppUrl = "http://10.0.2.2:3000"
)

$FlutterRoot = if ($env:FLUTTER_ROOT) { $env:FLUTTER_ROOT } else { "C:\Users\ldiak\flutter" }
$Flutter = Join-Path $FlutterRoot "bin\flutter.bat"

if (-not (Test-Path $Flutter)) {
  Write-Host "Flutter introuvable : $Flutter" -ForegroundColor Red
  Write-Host "Installez Flutter ou definissez FLUTTER_ROOT."
  exit 1
}

$env:PATH = "$(Split-Path $Flutter -Parent);$env:PATH"
Set-Location $PSScriptRoot

Write-Host "Flutter : $Flutter" -ForegroundColor Cyan
Write-Host "WEB_APP_URL : $WebAppUrl" -ForegroundColor Cyan
Write-Host "Assurez-vous que 'npm run dev' tourne a la racine du projet." -ForegroundColor Yellow

& $Flutter pub get
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& $Flutter run --dart-define="WEB_APP_URL=$WebAppUrl"
