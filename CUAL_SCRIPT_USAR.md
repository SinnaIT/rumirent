# 🎯 ¿Qué Script Usar? - Guía de Decisión

## 📊 Diagnóstico: ¿Cuál es tu situación?

### Escenario 1: DB tiene estructura ACTUALIZADA (del backup reciente de producción)

**Síntomas:**
- ✅ Restauraste un backup reciente de producción en QA
- ✅ La estructura de la DB está actualizada
- ❌ Error: "migrations are applied but missing from local directory"

**Solución:** `fix-qa-migrations-docker.sh`

```bash
./fix-qa-migrations-docker.sh
```

**Lo que hace:**
- Limpia registros de `_prisma_migrations`
- Marca baseline como aplicado **SIN ejecutar SQL**
- La estructura ya existe, solo actualiza el registro

---

### Escenario 2: DB tiene estructura DESACTUALIZADA (backup viejo o sin últimos cambios)

**Síntomas:**
- ❌ La app no funciona después de marcar el baseline
- ❌ Errores como "column does not exist", "relation does not exist"
- ❌ La DB no tiene los últimos cambios de estructura

**Solución:** `apply-baseline-sql-docker.sh` ⭐ **TU CASO**

```bash
./apply-baseline-sql-docker.sh
```

**Lo que hace:**
- **Ejecuta el SQL** del baseline para actualizar la estructura
- Crea tablas/columnas/enums que faltan
- Marca baseline como aplicado
- Actualiza la DB a la estructura correcta

---

### Escenario 3: Producción con migraciones antiguas

**Síntomas:**
- ✅ Producción funcionando con las 13 migraciones antiguas
- ✅ Estructura actualizada pero sin baseline
- ⚠️ Quieres consolidar a baseline

**Solución:** `apply-baseline-production-docker.sh`

```bash
./apply-baseline-production-docker.sh
```

**Lo que hace:**
- Limpia registros de migraciones antiguas
- Marca baseline como aplicado **SIN ejecutar SQL**
- Solo para producción con confirmación extra

---

## 🔍 Cómo Saber Qué Escenario Tienes

### Prueba 1: Verificar si la app funciona

```bash
# Reiniciar la app
docker restart rumirent-qa-app

# Ver logs
docker logs rumirent-qa-app --tail 50

# Si ves errores como:
# - "column X does not exist"
# - "relation Y does not exist"
# - "type Z does not exist"
# → Necesitas Escenario 2 (aplicar SQL)
```

### Prueba 2: Verificar estructura de la DB

```bash
# Ver si tiene columnas recientes
docker exec rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db -c "\d+ users"

# Buscar columnas específicas que agregaste recientemente
# Por ejemplo, si agregaste "birthDate":
docker exec rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'birthDate';"

# Si NO existe → Necesitas Escenario 2
```

### Prueba 3: Verificar enums

```bash
# Ver enums existentes
docker exec rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db -c "SELECT typname FROM pg_type WHERE typtype = 'e';"

# Verificar valores de un enum específico
docker exec rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db -c "SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'EstadoLead');"

# Si falta 'ENTREGADO' o 'CANCELADO' → Necesitas Escenario 2
```

---

## 🎯 Decisión Rápida

```
¿La app funciona después de marcar el baseline?
│
├─ SÍ → ✅ Todo bien, usaste el script correcto
│
└─ NO → ¿Qué error ves?
    │
    ├─ "column does not exist" → Escenario 2 (aplicar SQL)
    ├─ "relation does not exist" → Escenario 2 (aplicar SQL)
    ├─ "type does not exist" → Escenario 2 (aplicar SQL)
    └─ Otro error → Ver logs completos
```

---

## 📋 Tabla de Scripts

| Script | Cuándo Usar | Ejecuta SQL | Para |
|--------|-------------|-------------|------|
| `fix-qa-migrations-docker.sh` | DB actualizada, solo sincronizar registros | ❌ NO | QA |
| `apply-baseline-sql-docker.sh` | DB desactualizada, necesita estructura nueva | ✅ SÍ | QA ⭐ |
| `apply-baseline-production-docker.sh` | Producción con migraciones antiguas | ❌ NO | Producción |

---

## 🚀 Tu Caso Específico

Basado en que dijiste:

> "la db no tiene los últimos cambios a la estructura que se hicieron y la app no funciona"

**Necesitas:** `apply-baseline-sql-docker.sh`

```bash
# 1. Ejecutar
chmod +x apply-baseline-sql-docker.sh
./apply-baseline-sql-docker.sh

# 2. Confirmar cuando te lo pida
# Escribe 'SI'

# 3. Reiniciar cuando te lo pregunte
# Escribe 'y'

# 4. Verificar que la app funciona
docker logs -f rumirent-qa-app
curl http://localhost:3000/api/health
```

---

## 🔄 Flujo Correcto para QA

### Si restauraste un backup VIEJO:

```bash
1. restore-to-qa.sh backup.sql --fresh
   ↓ (restaura datos pero estructura vieja)

2. apply-baseline-sql-docker.sh
   ↓ (actualiza estructura ejecutando SQL)

3. docker restart rumirent-qa-app
   ↓ (reinicia con nueva estructura)

✅ App funcionando
```

### Si restauraste un backup RECIENTE de producción:

```bash
1. restore-to-qa.sh backup.sql --fresh
   ↓ (restaura datos y estructura actualizada)

2. fix-qa-migrations-docker.sh
   ↓ (solo limpia registros, NO ejecuta SQL)

3. docker restart rumirent-qa-app
   ↓ (reinicia)

✅ App funcionando
```

---

## ⚠️ Errores Comunes

### Error: "relation already exists"

**No es un error crítico.** Significa que la tabla ya existe. PostgreSQL omite el CREATE TABLE y continúa.

El script filtra estos mensajes automáticamente.

### Error: "column already exists"

**No es un error crítico.** Similar al anterior, PostgreSQL omite el ALTER TABLE ADD COLUMN.

### Error: "ERROR: invalid command"

**Sí es un error.** Significa que hay un problema con el SQL. Verifica que el archivo de migración está completo.

---

## ✅ Verificación Post-Aplicación

Después de ejecutar el script correcto:

```bash
# 1. Ver estado de Prisma
docker exec rumirent-qa-app sh -c "cd /app && npx prisma migrate status"
# Debe decir: "Database schema is up to date!"

# 2. Ver logs de la app
docker logs rumirent-qa-app --tail 50
# No debe haber errores de Prisma/DB

# 3. Probar health check
curl http://localhost:3000/api/health
# Debe responder 200 OK

# 4. Probar funcionalidad básica
# Login, crear cliente, etc.
```

---

## 📞 Si Nada Funciona

Si después de aplicar el script correcto la app sigue sin funcionar:

```bash
# 1. Ver logs completos
docker logs rumirent-qa-app --tail 100 > logs.txt

# 2. Ver qué tablas existen
docker exec rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db -c "\dt" > tables.txt

# 3. Ver estructura de tabla crítica
docker exec rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db -c "\d+ users" > users-schema.txt

# 4. Compartir estos archivos para análisis
```

---

**Creado:** 2025-12-10
**Para tu caso:** Usa `apply-baseline-sql-docker.sh`
**Documentación relacionada:** [USO_SCRIPTS_DOCKER.md](USO_SCRIPTS_DOCKER.md)
