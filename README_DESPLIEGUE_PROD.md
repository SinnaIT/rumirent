# 🚀 Despliegue a Producción - Resumen Rápido

## ✅ Lo que ya está hecho en desarrollo

- ✅ Migraciones consolidadas de 13 → 1
- ✅ Baseline limpia creada: `20251210075009_baseline_production_ready`
- ✅ Verificado y funcionando en desarrollo
- ✅ Backup de migraciones antiguas guardado

---

## 🎯 Pasos para Producción (Resumen Ejecutivo)

### 1. Commit y Push (Local)

```bash
git add prisma/migrations/ prisma/schema.prisma
git commit -m "chore: consolidate migrations into baseline for production"
git push origin main
```

### 2. Backup de Producción (CRÍTICO) ⚠️

```bash
export DATABASE_URL_PRODUCTION="postgresql://user:pass@host:5432/db"
pg_dump "$DATABASE_URL_PRODUCTION" > backup-prod-$(date +%Y%m%d-%H%M%S).sql
```

### 3. Aplicar en Servidor de Producción

```bash
# En el servidor
cd /path/to/rumirent-app
git pull origin main
npx prisma migrate deploy
npx prisma generate
pm2 restart rumirent-prod
```

### 4. Verificar

```bash
npx prisma migrate status  # Debe decir "up to date"
curl https://tudominio.com/api/health  # Debe responder 200
pm2 logs rumirent-prod --lines 50  # Buscar errores
```

---

## 📋 Checklist Mínimo

- [ ] ✅ Código pusheado a main
- [ ] ⚠️ Backup de producción creado
- [ ] ⚠️ `git pull` en servidor
- [ ] ⚠️ `npx prisma migrate deploy` sin errores
- [ ] ⚠️ `npx prisma generate` sin errores
- [ ] ⚠️ Aplicación reiniciada
- [ ] ⚠️ Health check OK
- [ ] ⚠️ Pruebas funcionales OK

---

## 🚨 Si Algo Sale Mal

```bash
# Rollback rápido
pm2 stop rumirent-prod
psql "$DATABASE_URL_PRODUCTION" < backup-prod-*.sql
git checkout HEAD~1
npm install
npx prisma generate
pm2 start rumirent-prod
```

---

## 📖 Documentación Completa

Ver **[PASOS_PRODUCCION.md](PASOS_PRODUCCION.md)** para guía detallada paso a paso.

---

**Migración:** 20251210075009_baseline_production_ready
**Estado Dev:** ✅ Listo
**Estado Prod:** ⏳ Pendiente
