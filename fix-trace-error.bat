@echo off
echo Limpiando archivos temporales de Next.js...

REM Matar todos los procesos de Node.js
taskkill /F /IM node.exe >nul 2>&1

REM Esperar un momento
timeout /t 2 /nobreak >nul

REM Eliminar la carpeta .next completamente
if exist .next (
    echo Eliminando carpeta .next...
    rmdir /S /Q .next
    echo Carpeta .next eliminada.
) else (
    echo La carpeta .next no existe.
)

REM Recrear la carpeta .next
mkdir .next >nul 2>&1

echo.
echo Limpieza completada. Ahora puedes ejecutar: pnpm dev
echo.
pause
