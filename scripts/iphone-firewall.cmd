@echo off
:: Ouvre les ports dev pour iPhone (Wi-Fi prive). Demande les droits admin.

net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Demande des droits administrateur...
  powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo.
echo === SUPCONTENT - ouverture pare-feu Wi-Fi prive ===
echo.

netsh advfirewall firewall delete rule name="SUPCONTENT Dev 3000" >nul 2>&1
netsh advfirewall firewall add rule name="SUPCONTENT Dev 3000" dir=in action=allow protocol=TCP localport=3000 profile=private
echo [OK] Port 3000

netsh advfirewall firewall delete rule name="SUPCONTENT Dev 4000" >nul 2>&1
netsh advfirewall firewall add rule name="SUPCONTENT Dev 4000" dir=in action=allow protocol=TCP localport=4000 profile=private
echo [OK] Port 4000

netsh advfirewall firewall delete rule name="SUPCONTENT Dev 30001" >nul 2>&1
netsh advfirewall firewall add rule name="SUPCONTENT Dev 30001" dir=in action=allow protocol=TCP localport=30001 profile=private
echo [OK] Port 30001

netsh advfirewall firewall delete rule name="Node.js SUPCONTENT Private" >nul 2>&1
netsh advfirewall firewall add rule name="Node.js SUPCONTENT Private" dir=in action=allow program="C:\Program Files\nodejs\node.exe" profile=private enable=yes
echo [OK] Node.js entrant sur reseau prive

echo.
echo Sur iPhone Safari :
powershell -NoProfile -Command "$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -match 'Wi-Fi|WLAN' -and $_.IPAddress -match '^192\.168\.' } | Select-Object -ExpandProperty IPAddress -First 1); if (-not $ip) { $ip = '192.168.1.112' }; Write-Host ('    http://' + $ip + ':3000') -ForegroundColor Green"
echo.
echo npm run dev:all doit tourner sur le PC.
echo.
pause
