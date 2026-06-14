# Dossier + zip Windows (Explorateur / 7-Zip / Moodle).
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

$FolderName = "SUPCONTENT-rendu"
$FolderPath = Join-Path $Root $FolderName
$ZipPath = Join-Path $Root "$FolderName.zip"

function Should-Skip {
  param([string]$rel)
  $r = $rel -replace '/', '\'
  if ($r -match '(^|\\)node_modules(\\|$)') { return $true }
  if ($r -match '(^|\\)\.next(\\|$)') { return $true }
  if ($r -match '(^|\\)\.git(\\|$)') { return $true }
  if ($r -match '(^|\\)\.idea(\\|$)') { return $true }
  if ($r -match '(^|\\)\.turbo(\\|$)') { return $true }
  if ($r -like 'mobile\.dart_tool*') { return $true }
  if ($r -like 'mobile\build*') { return $true }
  if ($r -like 'supabase\.temp*') { return $true }
  if ($r -like 'mobile\ios\Flutter\ephemeral*') { return $true }
  if ($r -like 'mobile\macos\Flutter\ephemeral*') { return $true }
  if ($r -eq '.env' -or $r -eq '.env.local' -or $r -eq 'server\.env') { return $true }
  if ($r -like '*.env' -and $r -notlike '*.env.example') { return $true }
  if ($r -eq $FolderName -or $r -like "$FolderName\*") { return $true }
  if ($r -like 'SUPCONTENT-rendu*.zip') { return $true }
  return $false
}

Write-Host "Preparation du dossier $FolderName ..." -ForegroundColor Cyan

if (Test-Path $FolderPath) { Remove-Item $FolderPath -Recurse -Force }
New-Item -ItemType Directory -Path $FolderPath -Force | Out-Null

Get-ChildItem -Path $Root -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
  if ($_.PSIsContainer) { return }
  $rel = $_.FullName.Substring($Root.Length + 1)
  if (Should-Skip $rel) { return }
  $dest = Join-Path $FolderPath $rel
  $destDir = Split-Path $dest -Parent
  if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
  Copy-Item $_.FullName $dest -Force
}

Write-Host "Compression (zip Windows)..." -ForegroundColor Cyan

if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force -ErrorAction SilentlyContinue }
Compress-Archive -Path $FolderPath -DestinationPath $ZipPath -CompressionLevel Optimal -Force

$sizeMb = [math]::Round((Get-Item $ZipPath).Length / 1MB, 2)
Write-Host ""
Write-Host "Pret :" -ForegroundColor Green
Write-Host "  Dossier : $FolderPath"
Write-Host "  Zip     : $ZipPath ($sizeMb MB)"
Write-Host ""
