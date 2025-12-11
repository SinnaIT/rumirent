# Guía de Migraciones - ¿Qué Script Usar?

## 🎯 Decisión Rápida

```
¿Tu base de datos es NUEVA/VACÍA (CI/CD, testing, nueva instalación)?
│
├─ SÍ → Usa: npx prisma migrate deploy
│         ✅ Funcionará automáticamente
│         ✅ Aplicará la migración baseline completa
│         ✅ Creará todas las tablas con todas las columnas
│
└─ NO → ¿Tu base de datos YA EXISTE con datos de producción?
         │
         └─ SÍ → Usa: ./migrate-production-existing.sh
                  ✅ Agregará solo las columnas que faltan
                  ✅ No tocará los datos existentes
                  ✅ Funcionará con migraciones antiguas
```

---

## 📋 Escenarios Detallados

### Escenario 1: CI/CD (GitHub Actions, GitLab CI, etc.)

**Situación**: Base de datos de testing que se crea desde cero en cada build

**Comando**:
```bash
npx prisma migrate deploy
```

**Por qué**:
- La DB está vacía
- Prisma aplicará la migración baseline `20250924201153_init_with_optional_commission`
- Esta migración crea TODAS las tablas con TODAS las columnas
- Incluye las columnas nuevas (activo, descripcion, plantillaOrigenId, tipoEntidad, etc.)

---

### Escenario 2: Producción Existente

**Situación**: Base de datos de producción que tiene datos y migraciones antiguas

**Comando**:
```bash
chmod +x migrate-production-existing.sh
./migrate-production-existing.sh rumirent-prod-db rumirent-prod-app rumirent_prod rumirent_prod_db
```

**Por qué**:
- La DB ya existe con datos
- Tiene migraciones antiguas aplicadas (de octubre 2025)
- Le faltan las columnas nuevas
- `npx prisma migrate deploy` fallaría porque detectaría que faltan migraciones intermedias
- Este script agrega solo las columnas que faltan usando ALTER TABLE

**Documentación**: Ver [PRODUCCION_CON_MIGRACIONES_ANTIGUAS.md](PRODUCCION_CON_MIGRACIONES_ANTIGUAS.md)

---

### Escenario 3: QA Existente

**Situación**: Base de datos de QA que tiene datos y estructura antigua

**Comando**:
```bash
chmod +x migrate-production-existing.sh
./migrate-production-existing.sh rumirent-qa-db rumirent-qa-app rumirent_qa rumirent_qa_db
```

**Por qué**: Mismo caso que producción - base de datos existente con estructura antigua

---

### Escenario 4: Nueva Instalación (Cliente Nuevo)

**Situación**: Instalación completamente nueva para un cliente

**Comando**:
```bash
npx prisma migrate deploy
```

**Por qué**:
- DB vacía
- Aplicará la migración baseline que crea todo desde cero
- Estructura completa y actualizada

---

## 📊 Tabla Comparativa

| Escenario | Comando | DB Vacía? | Tiene Migraciones Antiguas? | Resultado |
|-----------|---------|-----------|----------------------------|-----------|
| **CI/CD** | `npx prisma migrate deploy` | ✅ Sí | ❌ No | Crea todo desde cero |
| **Producción** | `./migrate-production-existing.sh` | ❌ No | ✅ Sí | Agrega columnas faltantes |
| **QA Existente** | `./migrate-production-existing.sh` | ❌ No | ✅ Sí | Agrega columnas faltantes |
| **Nueva Instalación** | `npx prisma migrate deploy` | ✅ Sí | ❌ No | Crea todo desde cero |

---

## 🔍 ¿Cómo Saber Si Mi DB Tiene Migraciones Antiguas?

```bash
# Conectarse a la DB y verificar
docker exec rumirent-prod-db psql -U rumirent_prod -d rumirent_prod_db -c "SELECT migration_name FROM _prisma_migrations ORDER BY finished_at;"

# Si ves migraciones como:
# - 20250924201153_init_with_optional_commission
# - 20251022140456_add_edificio_mejoras_completas
# - 20251023183046_add_metas_mensuales
# etc.
# → Tienes migraciones antiguas → Usa migrate-production-existing.sh

# Si la tabla _prisma_migrations no existe o está vacía:
# → DB nueva → Usa npx prisma migrate deploy
```

---

## ⚠️ Errores Comunes

### Error: "relation does not exist"

**Mensaje completo**:
```
ERROR: relation "tipos_unidad_edificio" does not exist
```

**Causa**: Estás usando `npx prisma migrate deploy` en una DB vacía pero la migración intenta agregar columnas a tablas que no existen

**Solución**:
- Si la DB es nueva → Ya no debería pasar (tenemos migración baseline)
- Si la DB es existente → Usa `./migrate-production-existing.sh`

### Error: "Migration failed to apply"

**Mensaje completo**:
```
A migration failed to apply. New migrations cannot be applied before the error is recovered from.
```

**Causa**: Una migración falló y Prisma bloqueó las migraciones futuras

**Solución**:
```bash
# Ver qué migración falló
npx prisma migrate status

# Si fue en CI/CD (DB de testing), simplemente rebuildealo
# Si fue en producción/QA, usa migrate-production-existing.sh
```

---

## 🚀 Proceso Recomendado para Deployment

### 1. CI/CD (Automático)
```yaml
# En .github/workflows/build.yml o similar
- name: Run migrations
  run: npx prisma migrate deploy
```

### 2. Producción (Manual)
```bash
# En el servidor de producción
git pull origin main
chmod +x migrate-production-existing.sh
./migrate-production-existing.sh
```

### 3. QA (Manual o Automático)
```bash
# En el servidor de QA
git pull origin main
chmod +x migrate-production-existing.sh
./migrate-production-existing.sh rumirent-qa-db rumirent-qa-app rumirent_qa rumirent_qa_db
```

---

## 📁 Archivos de Migración

```
prisma/migrations/
└── 20250924201153_init_with_optional_commission/
    └── migration.sql    # Migración baseline completa
                         # Crea TODAS las tablas con TODAS las columnas
                         # Incluye columnas nuevas

Scripts de migración:
├── migrate-production-existing.sh   # Para producción/QA existentes
└── apply-migration-to-qa.sh        # (OBSOLETO - usar migrate-production-existing.sh)
└── apply-migration-to-production.sh # (OBSOLETO - usar migrate-production-existing.sh)
```

---

## 🎓 Entendiendo la Estrategia

**Antes** (lo que intentamos):
- Múltiples migraciones incrementales
- Baseline que asumía estructura completa
- Scripts diferentes para QA y producción
- Conflictos con CI/CD

**Ahora** (solución final):
- **Una migración baseline** que crea todo desde cero
  - ✅ Funciona para ambientes nuevos (CI/CD, nuevas instalaciones)
  - ✅ Contiene TODA la estructura actualizada
- **Un script para DBs existentes** (`migrate-production-existing.sh`)
  - ✅ Agrega solo las columnas que faltan
  - ✅ Funciona con migraciones antiguas
  - ✅ Sirve tanto para producción como para QA

**Resultado**:
- ✅ CI/CD funciona automáticamente
- ✅ Producción/QA se actualizan con un solo script
- ✅ Nuevas instalaciones funcionan out-of-the-box
- ✅ No hay conflictos entre versiones

---

**Última actualización**: 2025-12-11
**Versión**: 2.0 - Estrategia simplificada
