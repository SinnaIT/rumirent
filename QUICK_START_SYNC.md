# 🚀 Guía Rápida: Sincronizar Database

## 📋 Problema
Prisma Studio muestra errores porque el **schema está más actualizado que la database**.

## ✅ Solución Rápida

### Para DESARROLLO (Windows):

```bash
# Opción 1: Usar el script automatizado
.\scripts\sync-dev.bat

# Opción 2: Comandos manuales
npx prisma migrate reset      # Resetea y aplica todas las migraciones
npx prisma generate            # Genera el cliente
npx prisma studio              # Verifica que funciona
```

### Para DESARROLLO (Linux/Mac):

```bash
# Opción 1: Usar el script automatizado
./scripts/sync-dev.sh

# Opción 2: Comandos manuales
npx prisma migrate reset      # Resetea y aplica todas las migraciones
npx prisma generate            # Genera el cliente
npx prisma studio              # Verifica que funciona
```

### Para PRODUCCIÓN:

```bash
# Usar el script automatizado (Linux/Mac)
./scripts/deploy-prod.sh

# O comandos manuales:
pg_dump -Fc > backup.dump     # CRÍTICO: Backup primero
npx prisma migrate deploy     # Aplica migraciones pendientes
npx prisma generate            # Genera el cliente
pm2 restart all                # Reinicia la app
```

---

## 📝 ¿Qué hace cada comando?

| Comando | Qué hace | Cuándo usarlo |
|---------|----------|---------------|
| `migrate reset` | Borra TODO y recrea la DB | **Solo desarrollo** |
| `db push` | Sincroniza schema sin historial | **Solo desarrollo** |
| `migrate deploy` | Aplica migraciones con historial | **Producción** |
| `generate` | Crea el Prisma Client | **Después de cada migración** |

---

## ⚠️ Advertencias

1. **NUNCA** uses `migrate reset` en producción
2. **SIEMPRE** crea un backup antes de migrar producción
3. **NUNCA** uses `db push` en producción

---

## 🔍 Verificación

Después de sincronizar, verifica:

```bash
# 1. Abrir Prisma Studio (no debe haber errores)
npx prisma studio

# 2. Verificar migraciones
npx prisma migrate status

# 3. Probar la aplicación
pnpm dev
```

---

## 📚 Documentación Completa

Para más detalles, consulta: [SYNC_DATABASE_SOLUTION.md](SYNC_DATABASE_SOLUTION.md)

---

**Última actualización**: 2025-11-25
