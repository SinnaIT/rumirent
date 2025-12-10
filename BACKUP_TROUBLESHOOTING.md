# 🔧 Troubleshooting - Backup de Base de Datos

## Error: "pg_dump: command not found"

### Causa
PostgreSQL client tools no están instalados en el servidor.

### Soluciones

#### Opción 1: Instalar PostgreSQL Client

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql-client-14  # o la versión que necesites

# CentOS/RHEL/Amazon Linux
sudo yum install postgresql

# Alpine Linux (Docker)
apk add postgresql-client

# macOS
brew install postgresql
```

#### Opción 2: Verificar si está instalado pero no en el PATH

```bash
# Buscar pg_dump en el sistema
find /usr -name pg_dump 2>/dev/null
find /opt -name pg_dump 2>/dev/null

# Si lo encuentras, úsalo con ruta completa
/usr/bin/pg_dump $DATABASE_URL_PRODUCTION > backup.sql

# O agrégalo al PATH
export PATH=$PATH:/usr/pgsql-14/bin  # ajusta según tu instalación
```

---

## Error: "requires at least 2 arg(s), only received 1"

### Causa
Probablemente el script intenta usar un comando sin los parámetros correctos.

### Solución

```bash
# Usar el nuevo script que creé
chmod +x backup-production-db.sh
DATABASE_URL_PRODUCTION="postgresql://user:pass@host:5432/db" ./backup-production-db.sh
```

Este script tiene 4 métodos de backup y probará automáticamente hasta encontrar uno que funcione.

---

## Alternativas si pg_dump no está disponible

### Método 1: Backup desde Panel del Proveedor

Si tu base de datos está en:

- **Heroku**: `heroku pg:backups:capture --app tu-app`
- **AWS RDS**: Usar snapshots desde la consola de AWS
- **Digital Ocean**: Usar backups automáticos desde el panel
- **Render**: Usar el botón de backup en el dashboard
- **Railway**: Usar el comando `railway db backup`

### Método 2: Backup con Docker (si la DB está en contenedor)

```bash
# Listar contenedores
docker ps | grep postgres

# Hacer backup
docker exec -t nombre-contenedor pg_dump -U usuario nombre_db > backup.sql

# Ejemplo completo
docker exec -t rumirent-prod-db pg_dump -U rumirent_prod rumirent_prod_db > backup-$(date +%Y%m%d).sql
```

### Método 3: Backup con psql (solo datos, no estructura)

```bash
# Conectar y exportar tablas específicas
psql "$DATABASE_URL_PRODUCTION" <<'SQL' > backup-data.sql
COPY users TO STDOUT;
COPY edificios TO STDOUT;
COPY unidades TO STDOUT;
COPY clientes TO STDOUT;
COPY leads TO STDOUT;
SQL
```

### Método 4: Usar script Python (si tienes Python instalado)

```python
# backup.py
import subprocess
import os
from datetime import datetime

db_url = os.environ.get('DATABASE_URL_PRODUCTION')
timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
backup_file = f'backup-rumirent-{timestamp}.sql'

try:
    # Método 1: pg_dump directo
    subprocess.run(['pg_dump', db_url, '-f', backup_file], check=True)
    print(f"✅ Backup creado: {backup_file}")
except FileNotFoundError:
    print("❌ pg_dump no encontrado")
    # Aquí puedes agregar métodos alternativos
```

Ejecutar:
```bash
DATABASE_URL_PRODUCTION="postgresql://..." python backup.py
```

---

## Verificar el Backup

Una vez creado el backup, verificar que sea válido:

```bash
# Ver tamaño
ls -lh backup-*.sql

# Ver primeras líneas (debe tener SQL)
head -n 20 backup-*.sql

# Contar líneas
wc -l backup-*.sql

# Buscar palabras clave importantes
grep -c "CREATE TABLE" backup-*.sql
grep -c "INSERT INTO" backup-*.sql
```

### Un backup válido debe contener:

```sql
--
-- PostgreSQL database dump
--

-- Dumped from database version 14.x
-- Dumped by pg_dump version 14.x

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    ...
);

-- ... más CREATE TABLE ...

COPY public.users (...) FROM stdin;
-- ... datos ...
```

---

## Restaurar Backup (si necesitas probar)

```bash
# Restaurar en base de datos de prueba
psql "$DATABASE_URL_TEST" < backup-rumirent-20251207.sql

# O con parámetros separados
psql -h localhost -p 5432 -U usuario -d nombre_db < backup.sql
```

---

## Script de Backup Simplificado (Mínimo)

Si todo falla, usa este script minimalista:

```bash
#!/bin/bash
# backup-simple.sh

DB_URL="${DATABASE_URL_PRODUCTION}"
BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"

echo "🗄️ Creando backup..."

# Intentar con pg_dump
if command -v pg_dump &> /dev/null; then
    pg_dump "$DB_URL" > "$BACKUP_FILE" 2>&1

    if [ $? -eq 0 ] && [ -s "$BACKUP_FILE" ]; then
        echo "✅ Backup exitoso: $BACKUP_FILE"
        echo "📊 Tamaño: $(du -h $BACKUP_FILE | cut -f1)"
        exit 0
    fi
fi

echo "❌ No se pudo crear el backup"
echo ""
echo "Opciones:"
echo "1. Instalar PostgreSQL client: sudo apt-get install postgresql-client"
echo "2. Usar backup desde tu proveedor de base de datos"
echo "3. Usar Docker: docker exec postgres_container pg_dump ..."
exit 1
```

Uso:
```bash
chmod +x backup-simple.sh
DATABASE_URL_PRODUCTION="postgresql://..." ./backup-simple.sh
```

---

## Backup Manual (Última Opción)

Si nada funciona, puedes hacer backup manual usando un cliente GUI:

1. **pgAdmin**: Conectar a la DB → Right click en DB → Backup
2. **DBeaver**: Conectar → Tools → Backup Database
3. **TablePlus**: Conectar → File → Export → SQL Dump

---

## Checklist de Verificación

Después de crear el backup:

- [ ] El archivo existe y tiene tamaño > 0
- [ ] Contiene `CREATE TABLE` statements
- [ ] Contiene datos (`COPY` o `INSERT INTO`)
- [ ] Está guardado en un lugar seguro
- [ ] Probaste restaurarlo en una DB de prueba (opcional pero recomendado)

---

## Recomendación Final

Para producción, siempre:

1. **Configurar backups automáticos** en tu proveedor de DB
2. **Probar la restauración** de backups regularmente
3. **Guardar backups en múltiples lugares** (local + cloud)
4. **Documentar el procedimiento** específico de tu infraestructura

---

## Contacto con Proveedor

Si tu base de datos está administrada por un proveedor:

| Proveedor | Documentación de Backups |
|-----------|--------------------------|
| Heroku | https://devcenter.heroku.com/articles/heroku-postgres-backups |
| AWS RDS | https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_CommonTasks.BackupRestore.html |
| Digital Ocean | https://docs.digitalocean.com/products/databases/postgresql/how-to/manage-backups/ |
| Render | https://render.com/docs/databases#backups |
| Railway | https://docs.railway.app/databases/postgresql#backups |
| Supabase | https://supabase.com/docs/guides/platform/backups |

Muchos de estos proveedores tienen **backups automáticos diarios** ya configurados.
