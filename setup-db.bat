@echo off
echo 🔄 Configurando base de datos...

echo 📦 Generando cliente Prisma...
call npx prisma generate

echo 🗃️ Creando migración inicial...
call npx prisma migrate dev --name init-with-optional-commission

echo 🌱 Ejecutando seed...
call npx prisma db seed

echo ✅ Base de datos configurada exitosamente!
pause