# Compile et installe SUPCONTENT sur l emulateur (sans mode debug interactif).
param(
  [string]$WebAppUrl = "http://10.0.2.2:3000"
)

$Sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "$env:LOCALAPPDATA\Android\Sdk" }
$Flutter = if ($env:FLUTTER_ROOT) { Join-Path $env:FLUTTER_ROOT "bin\flutter.bat" } else { "C:\Users\ldiak\flutter\bin\flutter.bat" }
$Adb = Join-Path $Sdk "platform-tools\adb.exe"
$Apk = Join-Path $PSScriptRoot "build\app\outputs\flutter-apk\app-debug.apk"

$env:ANDROID_HOME = $Sdk
$env:ANDROID_SDK_ROOT = $Sdk
$env:PATH = "$(Join-Path $Sdk platform-tools);$(Join-Path $Sdk emulator);$(Split-Path $Flutter -Parent);$env:PATH"
Set-Location $PSScriptRoot

$ready = (& $Adb devices 2>&1 | Out-String) -match "emulator-\d+\s+device"
if (-not $ready) {
  Write-Host "Aucun emulateur actif. Lancez : npm run mobile:emulator" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path $Apk)) {
  Write-Host "Premiere compilation : comptez 10 a 15 minutes..." -ForegroundColor Yellow
  & $Flutter build apk --debug --dart-define="WEB_APP_URL=$WebAppUrl"
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
  Write-Host "Recompilation rapide..." -ForegroundColor Cyan
  & $Flutter build apk --debug --dart-define="WEB_APP_URL=$WebAppUrl"
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

& $Adb install -r $Apk
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "SUPCONTENT installe. Ouvrez l icone SUPCONTENT dans le tiroir d apps." -ForegroundColor Green
Write-Host "N oubliez pas : npm run dev (dans un autre terminal)" -ForegroundColor Yellow

& $Adb shell am start -n "com.example.supcontentt_mobile/.MainActivity"
