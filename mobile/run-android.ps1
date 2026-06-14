# Lance SUPCONTENT sur emulateur Android (pas besoin de Visual Studio).
param(
  [string]$WebAppUrl = "http://10.0.2.2:3000",
  [string]$EmulatorId = "Pixel_9a",
  [int]$BootTimeoutSec = 180
)

$Sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } elseif ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } else { "$env:LOCALAPPDATA\Android\Sdk" }
$FlutterRoot = if ($env:FLUTTER_ROOT) { $env:FLUTTER_ROOT } else { "C:\Users\ldiak\flutter" }
$Flutter = Join-Path $FlutterRoot "bin\flutter.bat"
$Emulator = Join-Path $Sdk "emulator\emulator.exe"
$Adb = Join-Path $Sdk "platform-tools\adb.exe"

if (-not (Test-Path $Flutter)) {
  Write-Host "Flutter introuvable : $Flutter" -ForegroundColor Red
  exit 1
}
if (-not (Test-Path $Emulator)) {
  Write-Host "Emulateur Android introuvable : $Emulator" -ForegroundColor Red
  Write-Host "Installez Android Studio > SDK Manager > Android Emulator." -ForegroundColor Yellow
  exit 1
}

$env:ANDROID_HOME = $Sdk
$env:ANDROID_SDK_ROOT = $Sdk
$env:PATH = "$(Join-Path $Sdk emulator);$(Join-Path $Sdk platform-tools);$(Split-Path $Flutter -Parent);$env:PATH"
Set-Location $PSScriptRoot

function Test-AndroidDeviceReady {
  if (-not (Test-Path $Adb)) { return $false }
  $out = & $Adb devices 2>&1 | Out-String
  return ($out -match "emulator-\d+\s+device")
}

function Start-AndroidEmulator {
  param([string]$AvdId)
  Write-Host "Demarrage de l emulateur $AvdId ..." -ForegroundColor Yellow
  Write-Host "(La fenetre peut mettre 1-2 min - verifiez la barre des taches)" -ForegroundColor DarkGray
  $args = "-avd", $AvdId, "-gpu", "auto"
  Start-Process -FilePath $Emulator -ArgumentList $args -WindowStyle Normal | Out-Null
}

Write-Host "=== SUPCONTENT Mobile (Android) ===" -ForegroundColor Cyan
Write-Host "WEB_APP_URL : $WebAppUrl"
Write-Host "SDK         : $Sdk"

$checkScript = Join-Path (Split-Path $PSScriptRoot -Parent) "scripts\check-dev.ps1"
if (Test-Path $checkScript) {
  & powershell -ExecutionPolicy Bypass -File $checkScript
  if ($LASTEXITCODE -ne 0) { exit 1 }
} else {
  Write-Host "Dans un autre terminal : npm run dev (racine du projet)" -ForegroundColor Yellow
}

if (-not (Test-AndroidDeviceReady)) {
  $avds = & $Emulator -list-avds 2>&1
  if ($EmulatorId -notin $avds) {
    Write-Host "AVD $EmulatorId introuvable. Disponibles : $($avds -join ', ')" -ForegroundColor Red
    if ($avds.Count -gt 0) { $EmulatorId = $avds[0] }
    else { exit 1 }
  }

  Start-AndroidEmulator -AvdId $EmulatorId

  $elapsed = 0
  while (-not (Test-AndroidDeviceReady) -and $elapsed -lt $BootTimeoutSec) {
    Start-Sleep -Seconds 5
    $elapsed += 5
    Write-Host "  Attente emulateur... ${elapsed}s / ${BootTimeoutSec}s"
  }

  if (-not (Test-AndroidDeviceReady)) {
    Write-Host "L emulateur ne repond pas apres ${BootTimeoutSec}s." -ForegroundColor Red
    Write-Host "Essayez manuellement :" -ForegroundColor Yellow
    Write-Host "  Android Studio > Device Manager > Play sur Pixel 9a"
    Write-Host "  ou : $Emulator -avd $EmulatorId"
    exit 1
  }
  Write-Host "Emulateur pret." -ForegroundColor Green
} else {
  Write-Host "Emulateur deja actif." -ForegroundColor Green
}

# Redemarrer ADB (corrige souvent "log reader stopped unexpectedly")
if (Test-Path $Adb) {
  & $Adb kill-server 2>$null
  Start-Sleep -Seconds 1
  & $Adb start-server 2>$null
  Start-Sleep -Seconds 2
}

$bootWait = 0
while ($bootWait -lt 60) {
  $booted = (& $Adb shell getprop sys.boot_completed 2>$null).ToString().Trim()
  if ($booted -eq "1") { break }
  Start-Sleep -Seconds 2
  $bootWait += 2
}

& $Flutter pub get
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$deviceId = "android"
$adbOut = & $Adb devices 2>&1 | Out-String
if ($adbOut -match "(emulator-\d+)\s+device") {
  $deviceId = $Matches[1]
}

Write-Host ""
Write-Host "Installation de SUPCONTENT sur l emulateur..." -ForegroundColor Cyan
Write-Host "Premiere fois : compilation Gradle 10-15 min. Ne fermez pas ce terminal." -ForegroundColor Yellow
Write-Host "L app s ouvrira automatiquement (icone : SUPCONTENT)." -ForegroundColor Yellow
Write-Host ""

& $Flutter run -d $deviceId --dart-define="WEB_APP_URL=$WebAppUrl"
if ($LASTEXITCODE -eq 0) { exit 0 }

Write-Host ""
Write-Host "[!!] Connexion debug Flutter echouee (APK souvent deja installe)." -ForegroundColor Yellow
Write-Host "     Contournement : installation + lancement direct..." -ForegroundColor Yellow
Write-Host ""

$Apk = Join-Path $PSScriptRoot "build\app\outputs\flutter-apk\app-debug.apk"
if (-not (Test-Path $Apk)) {
  & $Flutter build apk --debug --dart-define="WEB_APP_URL=$WebAppUrl"
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

& $Adb install -r $Apk
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& $Adb shell am start -n "com.example.supcontentt_mobile/.MainActivity"

Write-Host ""
Write-Host "[OK] SUPCONTENT lance sur l emulateur." -ForegroundColor Green
Write-Host "     Si l ecran reste blanc : npm run dev:all dans un autre terminal." -ForegroundColor Yellow
Write-Host "     Hot reload indisponible dans ce mode ; relancez npm run mobile:run pour reessayer le debug." -ForegroundColor DarkGray
Write-Host ""
