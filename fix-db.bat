@echo off
echo ========================================
echo  SINCRONIZANDO BASE DE DATOS
echo ========================================
echo.
echo Este script sincronizara el schema de Prisma
echo con la base de datos actual.
echo.
echo IMPORTANTE: NO borrara datos existentes.
echo.
pause

echo.
echo [1/3] Sincronizando schema con base de datos...
call npx prisma db push --accept-data-loss

if errorlevel 1 (
    echo.
    echo ERROR: Fallo la sincronizacion
    echo Revisa los errores arriba.
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Base de datos sincronizada
echo.

echo [2/3] Generando Prisma Client...
call npx prisma generate

if errorlevel 1 (
    echo.
    echo ERROR: Fallo la generacion del cliente
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Cliente generado
echo.

echo [3/3] Verificando estado...
call npx prisma migrate status

echo.
echo ========================================
echo  COMPLETADO
echo ========================================
echo.
echo Ahora puedes iniciar el servidor:
echo   pnpm dev
echo.
pause
