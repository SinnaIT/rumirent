# 📄 Comandos de Base de Datos - Guía Completa

Este archivo contiene todos los comandos necesarios para aplicar cambios a los esquemas de la base de datos en el proyecto RumiRent.

## 🔧 Comandos Principales

### 1. Generar Cliente de Prisma
Ejecutar después de cualquier cambio en `prisma/schema.prisma`:
```bash
npx prisma generate
```

### 2. Crear Nueva Migración
Cuando hayas modificado el schema y quieras aplicar los cambios:
```bash
npx prisma migrate dev --name "descripcion_del_cambio"
```

**Ejemplos de nombres de migración:**
```bash
npx prisma migrate dev --name "add_user_phone_field"
npx prisma migrate dev --name "update_contract_status_enum"
npx prisma migrate dev --name "add_commission_table"
```

### 3. Aplicar Migraciones Pendientes
Para aplicar migraciones que no se han ejecutado:
```bash
npx prisma migrate deploy
```

### 4. Reiniciar Base de Datos (⚠️ PELIGROSO)
**SOLO para desarrollo - DESTRUYE TODOS LOS DATOS:**
```bash
npx prisma migrate reset --force
```

### 5. Ver Estado de Migraciones
Para verificar qué migraciones se han aplicado:
```bash
npx prisma migrate status
```

## 🛠️ Comandos de Utilidad

### 6. Abrir Prisma Studio
Para ver y editar datos de la base de datos:
```bash
npx prisma studio
```

### 7. Verificar Conexión a BD
Para probar la conexión a la base de datos:
```bash
npx prisma db pull
```

### 8. Push de Schema (Sin Migración)
Para aplicar cambios directamente sin crear archivos de migración:
```bash
npx prisma db push
```
> ⚠️ **No recomendado para producción**

### 9. Semillas (Seed) de Datos
Si tienes un archivo seed configurado:
```bash
npx prisma db seed
npm run db:seed  
```

## 📋 Flujo de Trabajo Recomendado

### Para Cambios Normales:
1. **Modificar** `prisma/schema.prisma`
2. **Generar cliente**: `npx prisma generate`
3. **Crear migración**: `npx prisma migrate dev --name "descripcion"`
4. **Verificar cambios** en Prisma Studio: `npx prisma studio`

### Para Cambios Complejos:
1. **Backup de datos** (si es necesario)
2. **Modificar schema**
3. **Generar cliente**: `npx prisma generate`
4. **Revisar migración**: `npx prisma migrate dev --name "descripcion"`
5. **Probar en desarrollo**
6. **Aplicar en producción**: `npx prisma migrate deploy`

## 🚨 Comandos de Emergencia

### Si las migraciones están desincronizadas:
```bash
# 1. Ver estado
npx prisma migrate status

# 2. Resolver conflictos (desarrollo)
npx prisma migrate reset --force

# 3. Regenerar cliente
npx prisma generate
```

### Si el cliente de Prisma está corrupto:
```bash
# 1. Limpiar y reinstalar
rm -rf node_modules/.prisma
npm install

# 2. Regenerar cliente
npx prisma generate
```

## 📚 Comandos Específicos del Proyecto

### Comandos que has usado en este proyecto:
```bash
# Último reset aplicado
npx prisma migrate reset --force

# Regenerar cliente después de cambios
npx prisma generate

# Crear migración para campo manual de unidad
npx prisma migrate dev --name "add_manual_unit_field"

# Verificar estructura actual
npx prisma studio
```

## 🔍 Variables de Entorno Necesarias

Asegúrate de tener configurado en tu `.env`:
```env
DATABASE_URL="postgresql://usuario:password@localhost:5455/contractor_db_dev"
```

## ⚠️ Advertencias Importantes

1. **NUNCA** ejecutar `npx prisma migrate reset` en producción
2. **SIEMPRE** hacer backup antes de cambios importantes
3. **VERIFICAR** que las migraciones sean correctas antes de aplicar
4. **PROBAR** en desarrollo antes de llevar a producción
5. **COORDINAR** con el equipo antes de cambios de schema

## 📞 En Caso de Problemas

### Error: "Database schema is out of sync"
```bash
npx prisma migrate reset --force
npx prisma generate
```

### Error: "Migration failed"
```bash
npx prisma migrate status
npx prisma migrate resolve --applied "migration_name"
```

### Error: "Cannot connect to database"
1. Verificar que PostgreSQL esté corriendo
2. Verificar DATABASE_URL en .env
3. Verificar permisos de usuario de BD

---

**📝 Nota:** Guarda este archivo en tu repositorio y actualízalo cada vez que hagas cambios importantes al schema de la base de datos.