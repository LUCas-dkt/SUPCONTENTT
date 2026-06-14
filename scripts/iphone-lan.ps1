# Ouvre le pare-feu Windows pour iPhone (Wi-Fi prive) + affiche l URL.
# Relance automatiquement en administrateur si necessaire.

param(
  [switch]$SkipElevation
)

$Root = Split-Path $PSScriptRoot -Parent

function Test-IsAdmin {
  ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
  )
}

function Get-LanIp {
  $wifi = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.InterfaceAlias -match 'Wi-Fi|WLAN' -and $_.IPAddress -match '^192\.168\.' } |
    Select-Object -ExpandProperty IPAddress -First 1
  if ($wifi) { return $wifi }

  return (ipconfig | Select-String '192\.168\.\d+\.\d+' | ForEach-Object { $_.Matches.Value } |
    Where-Object { $_ -notmatch '\.(1|254)$' } | Select-Object -First 1)
}

function Open-FirewallRules {
  $ports = @(3000, 4000, 30001)
  foreach ($port in $ports) {
    $name = "SUPCONTENT Dev $port"
    Remove-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue | Out-Null
    New-NetFirewallRule -DisplayName $name -Direction Inbound -Action Allow `
      -Protocol TCP -LocalPort $port -Profile Private | Out-Null
    Write-Host "[OK] Port $port ouvert (reseau prive)" -ForegroundColor Green
  }

  $nodePath = "C:\Program Files\nodejs\node.exe"
  if (Test-Path $nodePath) {
    Remove-NetFirewallRule -DisplayName "Node.js SUPCONTENT Private" -ErrorAction SilentlyContinue | Out-Null
    New-NetFirewallRule -DisplayName "Node.js SUPCONTENT Private" -Direction Inbound -Action Allow `
      -Program $nodePath -Profile Private | Out-Null
    Write-Host "[OK] Node.js autorise entrant (reseau prive)" -ForegroundColor Green
  }
}

function Test-NodeFirewallGap {
  $rules = netsh advfirewall firewall show rule name="Node.js JavaScript Runtime" verbose 2>$null
  if ($rules -match 'Profils\s*:\s*Public' -and $rules -notmatch 'Profils\s*:\s*.*Priv') {
    Write-Host "[!!] Node.js autorise seulement sur reseau PUBLIC, pas PRIVE." -ForegroundColor Yellow
    Write-Host "     C est probablement la cause du blocage iPhone." -ForegroundColor Yellow
    return $true
  }
  return $false
}

if (-not (Test-IsAdmin) -and -not $SkipElevation) {
  Write-Host "Elevation admin requise pour le pare-feu..." -ForegroundColor Yellow
  $arg = "-ExecutionPolicy Bypass -File `"$PSCommandPath`" -SkipElevation"
  Start-Process powershell -Verb RunAs -ArgumentList $arg
  exit 0
}

$ip = Get-LanIp
if (-not $ip) {
  Write-Host "[!!] IP Wi-Fi introuvable. Connectez le PC au Wi-Fi." -ForegroundColor Red
  exit 1
}

$url = "http://${ip}:3000"

Write-Host ""
Write-Host "=== SUPCONTENT iPhone ===" -ForegroundColor Cyan
Write-Host ""

Test-NodeFirewallGap | Out-Null

if (Test-IsAdmin) {
  Open-FirewallRules
} else {
  Write-Host "[!!] Toujours pas admin - lancez scripts\iphone-firewall.cmd a la main." -ForegroundColor Red
}

Write-Host ""
Write-Host "URL pour iPhone Safari :" -ForegroundColor White
Write-Host "  $url" -ForegroundColor Green
Write-Host ""
Write-Host "Checks :" -ForegroundColor White

$devRunning = (netstat -an | Select-String ':3000\s+.*LISTENING') -ne $null
if ($devRunning) {
  Write-Host "  [OK] Serveur web port 3000 actif" -ForegroundColor Green
} else {
  Write-Host "  [!!] Lancez : npm run dev:all" -ForegroundColor Red
}

try {
  $code = (Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 8).StatusCode
  Write-Host "  [OK] $url -> HTTP $code" -ForegroundColor Green
} catch {
  Write-Host "  [!!] $url injoignable depuis le PC" -ForegroundColor Red
}

Write-Host ""
Write-Host "Sur iPhone :" -ForegroundColor White
Write-Host "  - Meme Wi-Fi que le PC (pas 4G, pas Wi-Fi invite)" -ForegroundColor Gray
Write-Host "  - Safari : $url (avec http:// et :3000)" -ForegroundColor Gray
Write-Host "  - VPN desactive sur iPhone et PC" -ForegroundColor Gray
Write-Host ""
