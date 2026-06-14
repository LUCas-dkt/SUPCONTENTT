@echo off
setlocal
set "FLUTTER_ROOT=C:\Users\ldiak\flutter"
if defined FLUTTER_ROOT_USER set "FLUTTER_ROOT=%FLUTTER_ROOT_USER%"
set "WEB_APP_URL=http://10.0.2.2:3000"
if not "%~1"=="" set "WEB_APP_URL=%~1"
cd /d "%~dp0"
if not exist "%FLUTTER_ROOT%\bin\flutter.bat" (
  echo Flutter introuvable dans %FLUTTER_ROOT%\bin
  echo Definissez FLUTTER_ROOT_USER ou installez Flutter.
  exit /b 1
)
echo WEB_APP_URL=%WEB_APP_URL%
echo Lancez "npm run dev" a la racine du projet dans un autre terminal.
"%FLUTTER_ROOT%\bin\flutter.bat" pub get
"%FLUTTER_ROOT%\bin\flutter.bat" run --dart-define=WEB_APP_URL=%WEB_APP_URL%
