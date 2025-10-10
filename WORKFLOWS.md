# GitHub Actions Workflows

Este documento explica cómo funcionan los workflows de CI/CD del proyecto y cómo controlarlos.

## Estructura de Workflows

### 1. Test Workflow (`.github/workflows/test.yml`)

**Propósito**: Ejecutar tests de forma independiente del deployment.

#### Triggers:

- **Manual (`workflow_dispatch`)**: Puedes ejecutar tests cuando quieras desde la UI de GitHub
  - Ve a: `Actions` → `Run Tests` → `Run workflow`
  - Opción: `Run full test suite` (true/false)

- **Pull Requests** (opcional): Se ejecuta automáticamente en PRs a `main` o `develop`
  - Solo cuando hay cambios en: `src/`, `prisma/`, `package.json`, `pnpm-lock.yaml`

- **Push a `develop`** (opcional): Se ejecuta en commits a la rama develop

- **Workflow Call**: Puede ser llamado desde otros workflows

#### Características:

- ✅ Configuración completa de PostgreSQL de prueba
- ✅ Ejecuta migraciones de Prisma
- ✅ Corre todos los tests con `pnpm test:run`
- ✅ Genera artefactos con resultados y cobertura (30 días de retención)
- ✅ Comenta resultados automáticamente en PRs

#### Cómo Ejecutar Manualmente:

```bash
# Desde GitHub UI:
1. Ve a: https://github.com/[tu-repo]/actions/workflows/test.yml
2. Click en "Run workflow"
3. Selecciona la rama
4. Marca/desmarca "Run full test suite"
5. Click "Run workflow"
```

#### Desactivar Triggers Automáticos:

Si solo quieres ejecutar tests manualmente, comenta estas líneas en `test.yml`:

```yaml
# Comentar para desactivar en PRs
# pull_request:
#   branches: [main, develop]
#   paths:
#     - 'src/**'
#     - 'prisma/**'
#     - 'package.json'
#     - 'pnpm-lock.yaml'

# Comentar para desactivar en push
# push:
#   branches: [develop]
#   paths:
#     - 'src/**'
#     - 'prisma/**'
```

---

### 2. Deploy Workflow (`.github/workflows/deploy.yml`)

**Propósito**: Build de la imagen Docker y deployment al VPS.

#### Triggers:

- **Push a `main`**: Deploy automático a producción
- **Pull Requests a `main`**: Solo build (no deploy)
- **Manual (`workflow_dispatch`)**: Control total desde la UI
  - Opción 1: `Run tests before deployment` (true/false) - **DEFAULT: false**
  - Opción 2: `Deployment environment` (production/staging)

#### Comportamiento de Tests:

**Por defecto, los tests NO se ejecutan en el deployment.**

- ✅ **Push a `main`**: Deploy directo SIN tests
- ✅ **Pull Request**: Ejecuta tests para validación
- ✅ **Manual trigger**: Tú decides si incluir tests o no

#### Jobs:

1. **Test** (opcional):
   - Se ejecuta solo si:
     - Es PR, O
     - Es manual dispatch Y seleccionaste `run_tests: true`
   - Si se omite, el build continúa normalmente

2. **Build and Push**:
   - Construye imagen Docker
   - La sube a GitHub Container Registry (GHCR)
   - Usa caché para builds más rápidos
   - Continúa incluso si test fue omitido

3. **Deploy**:
   - Solo en `push` a `main` (no en PRs)
   - Conecta al VPS vía SSH
   - Pull de la imagen desde GHCR
   - Detiene contenedores viejos
   - Inicia nuevos contenedores
   - Ejecuta migraciones de Prisma
   - Limpia imágenes antiguas
   - Ejecuta health check

#### Cómo Usar:

##### Deploy Normal (SIN tests):

```bash
# Simplemente push a main:
git push origin main
```

##### Deploy CON tests:

```bash
# Desde GitHub UI:
1. Ve a: https://github.com/[tu-repo]/actions/workflows/deploy.yml
2. Click en "Run workflow"
3. Selecciona "main"
4. ✅ Marca "Run tests before deployment"
5. Selecciona environment (production/staging)
6. Click "Run workflow"
```

##### Deploy a Staging:

```bash
# Desde GitHub UI:
1. Ve a: Actions → Build and Deploy to VPS
2. Run workflow
3. Branch: develop (o la que uses para staging)
4. Environment: staging
5. Run workflow
```

---

## Configuración Recomendada

### Para Desarrollo Ágil (Deploy Rápido):

**Configuración actual (ya está así):**

- Deploy a producción: **SIN tests automáticos**
- Tests: **Workflow separado** ejecutado manualmente
- PRs: **CON tests** para validación

**Ventajas:**
- Deploys instantáneos
- No esperas 5+ minutos por tests en cada push
- Tests disponibles cuando los necesitas
- Validación en PRs antes de merge

### Para Máxima Seguridad:

Si prefieres SIEMPRE ejecutar tests antes de deploy, cambia esto en `deploy.yml`:

```yaml
# Línea 15 - Cambiar default de 'false' a 'true':
workflow_dispatch:
  inputs:
    run_tests:
      description: 'Run tests before deployment'
      required: false
      default: 'true'  # ← Cambiar aquí
      type: boolean
```

O forzar tests en push a main (línea 38-40):

```yaml
if: |
  (github.event_name == 'workflow_dispatch' && inputs.run_tests == true) ||
  (github.event_name == 'pull_request') ||
  (github.event_name == 'push' && github.ref == 'refs/heads/main')  # ← Agregar esto
```

---

## Secrets Requeridos

Configura estos secrets en: `Settings` → `Secrets and variables` → `Actions`

```
VPS_HOST          # IP o dominio del VPS
VPS_USERNAME      # Usuario SSH
VPS_SSH_KEY       # Private key SSH
VPS_SSH_PORT      # Puerto SSH (default: 22)
VPS_URL           # URL para health check (ej: https://tuapp.com)
GITHUB_TOKEN      # Automático (no configurar)
```

---

## Monitoreo

### Ver Estado de Workflows:

```bash
# En GitHub:
Repository → Actions → [Seleccionar workflow]

# Ver logs en tiempo real
Click en el run → Click en el job → Ver logs
```

### Health Check:

El deploy incluye un health check automático:

```bash
# Espera 30 segundos después del deploy
# Hace curl a: $VPS_URL/api/test
# Si falla, marca el deployment como fallido
```

---

## Troubleshooting

### Tests Fallan en PR pero no Localmente:

```bash
# Verificar variables de entorno en test.yml
DATABASE_URL: postgresql://test:test@localhost:5432/test_db
JWT_SECRET: test-jwt-secret-key-for-ci
JWT_EXPIRES_IN: 7d
```

### Deploy Falla en Migrations:

```bash
# Conectar al VPS y verificar:
cd /opt/rumirent-app
docker-compose -f docker-compose.deploy.yml logs app

# Ejecutar migrations manualmente:
docker-compose -f docker-compose.deploy.yml exec app sh -c "pnpm db:migrate:prod"
```

### Imagen No se Actualiza en VPS:

```bash
# En el VPS:
docker pull ghcr.io/[tu-repo]/[tu-app]:latest

# Verificar que la imagen sea nueva:
docker images | grep rumirent
```

---

## Personalización Rápida

### Solo Quiero Tests Manuales:

1. En `test.yml`: Comenta los triggers `pull_request` y `push`
2. En `deploy.yml`: Deja todo como está (tests disabled por default)
3. Ejecuta tests solo cuando quieras desde la UI

### Quiero Tests en Cada Deploy:

1. En `deploy.yml` línea 15: Cambia `default: 'false'` a `default: 'true'`

### Quiero Tests en Staging pero No en Producción:

```yaml
# En deploy.yml, job test, línea 38-40:
if: |
  (github.event_name == 'workflow_dispatch' && inputs.run_tests == true) ||
  (github.event_name == 'pull_request') ||
  (github.ref == 'refs/heads/staging')  # ← Agregar
```

---

## Resumen de Comandos

```bash
# Ejecutar tests manualmente
# GitHub UI → Actions → Run Tests → Run workflow

# Deploy SIN tests (default)
git push origin main

# Deploy CON tests
# GitHub UI → Actions → Build and Deploy to VPS → Run workflow → ✅ run_tests

# Ver status
# GitHub UI → Actions → [workflow name] → [latest run]

# Ver artefactos de tests
# GitHub UI → Actions → Run Tests → [run] → Artifacts → test-results
```

---

## Estructura de Archivos

```
.github/workflows/
├── test.yml          # Tests independientes (manual + auto en PRs)
└── deploy.yml        # Build + Deploy (tests opcionales)
```

---

**Última actualización**: 2025-10-09
