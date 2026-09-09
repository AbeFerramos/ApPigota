@echo off
echo ========================================
echo Iniciando La Pigota para la colla
echo ========================================
echo.
echo La aplicación estará disponible en:
echo - Local: http://localhost:8080
echo - Red: http://192.168.0.68:8080
echo.
echo Comparte la URL de RED con la colla
echo.
echo Presiona Ctrl+C para detener
echo ========================================
echo.

cd /d "%~dp0"
npm start