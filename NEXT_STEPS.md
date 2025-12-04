# 🎯 Próximos Pasos - Inmediatos

## Estado Actual

✅ **Implementaciones completadas:**
1. EstadoLead actualizado a 9 estados
2. Comisiones se calculan automáticamente al cambiar estado a DEPARTAMENTO_ENTREGADO
3. Sistema RumiRace implementado (ranking mensual de brokers)
4. Reportes actualizados para usar fechaPagoReserva
5. Filtro de RECHAZADO aplicado en todos los reportes
6. Scripts de sincronización creados para dev y producción

❌ **Problema pendiente:**
- La base de datos tiene un schema desactualizado
- Prisma Studio muestra errores porque faltan tablas/columnas

---

## ⚡ Lo Que Debes Hacer AHORA

### 1️⃣ Sincronizar la Base de Datos (DESARROLLO)

Tienes 2 opciones:

#### **Opción A: Reset Completo (Recomendada si puedes perder datos de desarrollo)**

```bash
# Windows
.\scripts\sync-dev.bat
# Selecciona opción 1

# Linux/Mac
./scripts/sync-dev.sh
# Selecciona opción 1
```

O manual:
```bash
npx prisma migrate reset
npx prisma generate
npx prisma studio
```

**Qué hace:**
- ✅ Elimina toda la base de datos de desarrollo
- ✅ Recrea todo desde cero según el schema
- ✅ Aplica todas las migraciones en orden
- ✅ Ejecuta el seed (datos de prueba)

#### **Opción B: Push Sin Perder Datos**

```bash
# Windows
.\scripts\sync-dev.bat
# Selecciona opción 2

# Linux/Mac
./scripts/sync-dev.sh
# Selecciona opción 2
```

O manual:
```bash
npx prisma db push
npx prisma generate
npx prisma studio
```

**Qué hace:**
- ✅ Sincroniza la database con el schema
- ✅ Mantiene los datos existentes (si no hay conflictos)
- ⚠️ NO crea archivos de migración

---

### 2️⃣ Verificar Que Todo Funciona

```bash
# 1. Verifica Prisma Studio (no debe haber errores)
npx prisma studio

# 2. Inicia el servidor de desarrollo
pnpm dev

# 3. Prueba los nuevos endpoints
```

---

### 3️⃣ Probar las Nuevas Funcionalidades

#### a) **Probar Estados de Lead**

1. Ve a `/admin/leads` o `/broker/ventas`
2. Edita un lead
3. Verifica que aparecen los 9 nuevos estados:
   - Ingresado
   - En Evaluación
   - Observado
   - Aprobado
   - Reserva Pagada
   - Contrato Firmado
   - Contrato Pagado
   - Departamento Entregado
   - Rechazado

#### b) **Probar Cálculo Automático de Comisiones**

1. Crea o edita un lead
2. Cambia el estado a "Departamento Entregado"
3. Verifica que la comisión se calcula automáticamente
4. Revisa los logs del servidor para ver el cálculo

#### c) **Probar RumiRace**

1. Ve a `/admin/reportes/rumi-race`
2. Selecciona un mes/año
3. Verifica que muestra el ranking de brokers
4. Ve a `/broker` (dashboard de broker)
5. Verifica que muestra tu posición en RumiRace

#### d) **Probar Reportes Actualizados**

1. Ve a `/admin/reportes/brokers-mensual`
2. Selecciona un mes
3. Verifica que usa `fechaPagoReserva` para filtrar
4. Verifica que NO aparecen leads con estado RECHAZADO

---

### 4️⃣ Recalcular Comisiones del Mes Actual

Si ya tienes leads en estado DEPARTAMENTO_ENTREGADO, recalcula sus comisiones:

```bash
# Opción A: Usar la API
curl -X POST http://localhost:3000/api/admin/leads/recalcular-comisiones \
  -H "Content-Type: application/json" \
  -d '{"mes": 11, "año": 2025}'

# Opción B: Desde el admin panel (si implementaste el botón)
```

---

### 5️⃣ Preparar para Producción (DESPUÉS de probar)

Cuando todo funcione en desarrollo:

```bash
# 1. Commit de las migraciones
git add prisma/migrations
git commit -m "feat: sync database schema with all updates"
git push

# 2. En el servidor de producción:
./scripts/deploy-prod.sh

# O manual:
pg_dump -Fc > backup_before_sync.dump
npx prisma migrate deploy
npx prisma generate
pm2 restart all  # o docker-compose restart
```

---

## 🚨 Si Encuentras Errores

### Error: "migration was modified"
```bash
# No te preocupes, es normal. Usa db push:
npx prisma db push
```

### Error: "unique constraint failed"
```bash
# Hay datos duplicados. Revisa con:
npx prisma studio
# Elimina duplicados manualmente
```

### Error en Prisma Studio (después de sincronizar)
```bash
# Regenera el cliente:
npx prisma generate
# Cierra y reabre Prisma Studio
```

---

## 📞 Checklist de Verificación

Antes de considerar que terminaste, verifica:

- [ ] Prisma Studio abre sin errores
- [ ] Puedes ver las 9 estados de lead en la UI
- [ ] La comisión se calcula automáticamente al cambiar a DEPARTAMENTO_ENTREGADO
- [ ] RumiRace muestra el ranking correctamente en `/admin/reportes/rumi-race`
- [ ] Tu posición de RumiRace aparece en el dashboard de broker
- [ ] El reporte mensual usa fechaPagoReserva
- [ ] Los leads RECHAZADO NO aparecen en reportes
- [ ] El servidor inicia sin errores (`pnpm dev`)

---

## 🎓 Documentación Completa

- **Guía Rápida**: [QUICK_START_SYNC.md](QUICK_START_SYNC.md)
- **Solución Detallada**: [SYNC_DATABASE_SOLUTION.md](SYNC_DATABASE_SOLUTION.md)

---

**Última actualización**: 2025-11-25
