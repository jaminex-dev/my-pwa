@echo off
echo 🚀 Configurando PWA en XAMPP...

REM Verificar si XAMPP está instalado
if not exist "C:\xampp\htdocs" (
    echo ❌ XAMPP no encontrado en C:\xampp\htdocs
    echo Instala XAMPP primero desde: https://www.apachefriends.org/
    pause
    exit /b 1
)

REM Crear directorio en XAMPP
if not exist "C:\xampp\htdocs\my-pwa" (
    mkdir "C:\xampp\htdocs\my-pwa"
    echo ✅ Directorio creado: C:\xampp\htdocs\my-pwa
)

REM Copiar archivos
echo 📁 Copiando archivos...
xcopy /E /Y "%~dp0*" "C:\xampp\htdocs\my-pwa\"

echo ✅ PWA instalada en XAMPP!
echo.
echo 🌐 URLs para acceder:
echo   - Local: http://localhost/my-pwa/
echo   - IP LAN: http://10.1.1.134/my-pwa/
echo   - Móviles: http://10.1.1.134/my-pwa/
echo.
echo 📱 Para probar en móvil:
echo   1. Conecta el móvil a la misma WiFi
echo   2. Ve a: http://10.1.1.134/my-pwa/
echo   3. La PWA detectará LAN automáticamente
echo.
echo 🔧 Panel de control: http://localhost/my-pwa/panel.html
echo 🧪 Test conectividad: http://localhost/my-pwa/test-conectividad.html
echo.
pause
