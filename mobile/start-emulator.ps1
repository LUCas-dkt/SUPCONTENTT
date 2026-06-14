# Demarre uniquement l emulateur Android (sans lancer Flutter).
param(
  [string]$EmulatorId = "Pixel_9a"
)

$Sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "$env:LOCALAPPDATA\Android\Sdk" }
$Emulator = Join-Path $Sdk "emulator\emulator.exe"
$Adb = Join-Path $Sdk "platform-tools\adb.exe"

$env:ANDROID_HOME = $Sdk
$env:ANDROID_SDK_ROOT = $Sdk

if (-not (Test-Path $Emulator)) {
  Write-Host "Emulateur introuvable. Installez Android Studio." -ForegroundColor Red
  exit 1
}

$ready = (& $Adb devices 2>&1 | Out-String) -match "emulator-\d+\s+device"
if ($ready) {
  Write-Host "Un emulateur tourne deja." -ForegroundColor Green
  exit 0
}

$avds = & $Emulator -list-avds
if ($EmulatorId -notin $avds -and $avds.Count -gt 0) { $EmulatorId = $avds[0] }

Write-Host "Lancement de $EmulatorId ..."
$args = "-avd", $EmulatorId, "-gpu", "auto"
Start-Process -FilePath $Emulator -ArgumentList $args -WindowStyle Normal
Write-Host "Attendez la fenetre de l emulateur (1-2 min), puis : npm run mobile:run"
