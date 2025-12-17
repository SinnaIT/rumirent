# Migración para Producción Existente

## 🎯 Caso de Uso

Este script es para **bases de datos de producción/QA que YA EXISTEN** y tienen las migraciones antiguas aplicadas (de octubre 2025).

**NO usar** para ambientes nuevos (CI/CD, test databases) - esos deben usar `npx prisma migrate deploy`.

---

## ❓ ¿Cuándo Usar Este Script?

Úsalo si tu base de datos:
- ✅ Ya tiene datos de producción
- ✅ Fue creada con migraciones antiguas (20250924, 20251022, 20251023, etc.)
- ✅ Le faltan las columnas nuevas (activo, descripcion, plantillaOrigenId, tipoEntidad, etc.)
- ✅ Da errores de "column does not exist"

**NO usar si:**
- ❌ Es una base de datos nueva/vacía
- ❌ Es un ambiente de CI/CD
- ❌ Es una base de datos de testing

---

## 🚀 Cómo Usar

### En Producción:

```bash
# 1. Actualizar código
git pull origin main

# 2. Dar permisos
chmod +x migrate-production-existing.sh

# 3. Ejecutar
./migrate-production-existing.sh rumirent-prod-db rumirent-prod-app rumirent_prod rumirent_prod_db

# 4. Cuando pregunte "¿Esta es una base de datos EXISTENTE con datos de producción?"
#    Escribe: SI

# 5. Cuando pregunte "¿Reiniciar ahora?"
#    Escribe: y
```

### En QA:

```bash
chmod +x migrate-production-existing.sh
./migrate-production-existing.sh rumirent-qa-db rumirent-qa-app rumirent_qa rumirent_qa_db
```

---

## 📋 Lo Que Hace el Script

1. ✅ Verifica que los contenedores están corriendo
2. ✅ Crea backup automático de la DB
3. ✅ **Actualiza enums**:
   - `EstadoLead`: Agrega 7 valores nuevos (INGRESADO, EN_EVALUACION, OBSERVADO, CONTRATO_FIRMADO, CONTRATO_PAGADO, DEPARTAMENTO_ENTREGADO, CANCELADO)
   - `TipoEntidad`: Crea el enum si no existe
4. ✅ **Crea tabla plantillas_tipo_unidad** (si no existe):
   - Con todas sus columnas y constraints
   - Con índices únicos para nombre y código
5. ✅ **Agrega las 8 columnas faltantes**:
   - `tipos_unidad_edificio.activo`
   - `tipos_unidad_edificio.descripcion`
   - `tipos_unidad_edificio.plantillaOrigenId`
   - `empresas.tipoEntidad`
   - `users.lastPasswordChange`
   - `users.mustChangePassword`
   - `users.resetToken`
   - `users.resetTokenExpiry`
6. ✅ **Agrega foreign key constraint**:
   - `tipos_unidad_edificio.plantillaOrigenId` → `plantillas_tipo_unidad.id`
7. ✅ Corrige datos problemáticos (telefono NULL en clientes)
8. ✅ Actualiza el registro de migraciones en `_prisma_migrations`
9. ✅ Genera Prisma Client
10. ✅ Verifica que los cambios se aplicaron correctamente
11. ✅ Reinicia la aplicación

---

## 🔒 Seguridad

- Crea backup automático antes de hacer cambios
- Usa `IF NOT EXISTS` para evitar errores si se ejecuta múltiples veces
- No elimina datos existentes
- Solo agrega columnas nuevas

---

## 🆘 Si Algo Sale Mal

```bash
# 1. Detener aplicación
docker stop rumirent-prod-app

# 2. Restaurar backup
docker exec -i rumirent-prod-db psql -U rumirent_prod -d rumirent_prod_db < backup-prod-before-columns-YYYYMMDD-HHMMSS.sql

# 3. Reiniciar aplicación
docker start rumirent-prod-app
```

---

## ✅ Verificación Post-Migración

```bash
# Verificar que no hay errores en logs
docker logs -f rumirent-prod-app

# Probar funcionalidad:
# - Gestión de empresas
# - Gestión de tipos de unidad
# - Login de usuarios
```

---

**Creado**: 2025-12-11
**Para**: Bases de datos de producción/QA existentes con migraciones antiguas
