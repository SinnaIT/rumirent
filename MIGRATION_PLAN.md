# Plan de Migración - RumiRent App

## Resumen de Cambios
Migración de la estructura de base de datos y código para implementar el nuevo diseño de entidades con comisiones flexibles, tipos de unidad por edificio, y gestión de clientes.

## Fase 1: Preparación y Base de Datos

### 1.1 Backup y Preparación
- [ ] **Crear backup completo** de la base de datos actual
- [ ] **Documentar datos existentes** para mapeo posterior
- [ ] **Verificar dependencias** de las entidades que se van a modificar

### 1.2 Migración de Schema Prisma
- [x] **Actualizar schema.prisma** (ya completado)
- [ ] **Generar nueva migración**: `npx prisma migrate dev --name "restructure-entities"`
- [ ] **Verificar migración** en ambiente de desarrollo
- [ ] **Ejecutar seed** con datos de prueba para nuevas entidades

### 1.3 Seed de Datos Iniciales
- [ ] **Crear comisiones base** (5%, 7%, 10%)
- [ ] **Migrar edificios existentes** asignándoles comisión base
- [ ] **Crear tipos de unidad** para edificios existentes
- [ ] **Migrar unidades** conectándolas a tipos de unidad
- [ ] **Crear clientes** desde contratos existentes
- [ ] **Migrar contratos** al nuevo formato

## Fase 2: Actualización de APIs Backend

### 2.1 Entidades Core - Orden de Prioridad

#### 2.1.1 Comisiones (Base del sistema)
- [ ] **src/app/api/admin/comisiones/route.ts**
  - [ ] GET: Listar todas las comisiones
  - [ ] POST: Crear nueva comisión
- [ ] **src/app/api/admin/comisiones/[id]/route.ts**
  - [ ] GET: Obtener comisión específica
  - [ ] PUT: Actualizar comisión
  - [ ] DELETE: Eliminar comisión (validar uso)

#### 2.1.2 Edificios (Actualizar para comisión base)
- [ ] **src/app/api/admin/edificios/route.ts**
  - [ ] Actualizar GET: Incluir comisión en respuesta
  - [ ] Actualizar POST: Requerir comisionId
- [ ] **src/app/api/admin/edificios/[id]/route.ts**
  - [ ] Actualizar GET: Incluir comisión y tipos de unidad
  - [ ] Actualizar PUT: Permitir cambiar comisionId
  - [ ] Actualizar DELETE: Validar cascada

#### 2.1.3 Tipos de Unidad por Edificio (Nueva entidad)
- [ ] **src/app/api/admin/edificios/[id]/tipos-unidad/route.ts**
  - [ ] GET: Listar tipos de unidad del edificio
  - [ ] POST: Crear nuevo tipo de unidad
- [ ] **src/app/api/admin/tipos-unidad/[id]/route.ts**
  - [ ] GET: Obtener tipo específico
  - [ ] PUT: Actualizar tipo de unidad
  - [ ] DELETE: Eliminar tipo (validar unidades asociadas)

#### 2.1.4 Unidades (Simplificar, conectar a tipos)
- [ ] **src/app/api/admin/unidades/route.ts**
  - [ ] Actualizar GET: Remover precio/prioridad, agregar tipoUnidadEdificioId
  - [ ] Actualizar POST: Validar tipoUnidadEdificioId obligatorio
- [ ] **src/app/api/admin/unidades/[id]/route.ts**
  - [ ] Actualizar PUT: Remover campos eliminados
  - [ ] Agregar cálculo de comisión dinámico

#### 2.1.5 Clientes (Nueva entidad)
- [ ] **src/app/api/admin/clientes/route.ts**
  - [ ] GET: Listar todos los clientes (admin)
  - [ ] Validación RUT chileno
- [ ] **src/app/api/admin/clientes/[id]/route.ts**
  - [ ] GET, PUT, DELETE para admin
- [ ] **src/app/api/contratista/clientes/route.ts**
  - [ ] GET: Solo clientes del contratista actual
  - [ ] POST: Crear cliente (asignar contratistaId automático)
- [ ] **src/app/api/contratista/clientes/[id]/route.ts**
  - [ ] GET, PUT, DELETE: Solo si es propietario

#### 2.1.6 Contratos (Reestructurar completamente)
- [ ] **src/app/api/admin/contratos/route.ts**
  - [ ] GET: Incluir nuevos campos (fechas, montos, estado)
  - [ ] POST: Validar nueva estructura
- [ ] **src/app/api/admin/contratos/[id]/route.ts**
  - [ ] Actualizar para nuevos campos
- [ ] **src/app/api/contratista/contratos/route.ts**
  - [ ] GET: Solo contratos del contratista
  - [ ] POST: Crear contrato con validaciones
- [ ] **src/app/api/contratista/contratos/[id]/route.ts**
  - [ ] PUT: Permitir cambio de estado del contrato

### 2.2 APIs de Soporte

#### 2.2.1 Usuarios (Agregar RUT)
- [ ] **src/app/api/auth/register/route.ts**
  - [ ] Agregar validación RUT obligatorio
- [ ] **src/app/api/admin/contratistas/route.ts**
  - [ ] Incluir RUT en listados y operaciones

#### 2.2.2 Cálculo de Comisiones
- [ ] **src/app/api/shared/comisiones/calculate/route.ts**
  - [ ] POST: Calcular comisión basada en tipo de unidad
  - [ ] Considerar jerarquía: TipoUnidad > Edificio

#### 2.2.3 Cambios Programados de Comisión
- [ ] **src/app/api/admin/comisiones/programados/route.ts**
  - [ ] GET, POST para cambios programados
- [ ] **Implementar job/cron** para ejecutar cambios programados

## Fase 3: Actualización del Frontend

### 3.1 Interfaces TypeScript
- [ ] **src/types/entities.ts** (crear si no existe)
  - [ ] Actualizar todas las interfaces según nuevo schema
  - [ ] Eliminar interfaces obsoletas
  - [ ] Agregar nuevos enums

### 3.2 Formularios y Validaciones
- [ ] **src/lib/validations.ts**
  - [ ] Agregar validación RUT chileno
  - [ ] Actualizar schemas Zod para todas las entidades
  - [ ] Validaciones para nuevos campos de contrato

### 3.3 Componentes Admin

#### 3.3.1 Gestión de Comisiones
- [ ] **src/app/admin/comisiones/page.tsx**
  - [ ] Lista de comisiones con CRUD
  - [ ] Indicador de uso (cuántos edificios/tipos usan cada comisión)
- [ ] **src/components/forms/ComisionForm.tsx**
  - [ ] Formulario para crear/editar comisiones

#### 3.3.2 Gestión de Edificios
- [ ] **src/app/admin/edificios/page.tsx**
  - [ ] Actualizar para mostrar comisión base
- [ ] **src/app/admin/edificios/[id]/page.tsx**
  - [ ] Agregar sección de tipos de unidad
  - [ ] Permitir asignar/cambiar comisión base
- [ ] **src/components/forms/EdificioForm.tsx**
  - [ ] Agregar selector de comisión

#### 3.3.3 Tipos de Unidad por Edificio
- [ ] **src/app/admin/edificios/[id]/tipos-unidad/page.tsx**
  - [ ] CRUD completo para tipos de unidad del edificio
- [ ] **src/components/forms/TipoUnidadForm.tsx**
  - [ ] Formulario con selector de comisión específica

#### 3.3.4 Gestión de Unidades
- [ ] **src/app/admin/unidades/page.tsx**
  - [ ] Remover columnas precio/prioridad
  - [ ] Agregar columna tipo de unidad con comisión
- [ ] **src/components/forms/UnidadForm.tsx**
  - [ ] Selector de tipo de unidad (dependiente de edificio)

#### 3.3.5 Gestión de Clientes
- [ ] **src/app/admin/clientes/page.tsx**
  - [ ] Lista de todos los clientes con contratista
- [ ] **src/components/forms/ClienteForm.tsx**
  - [ ] Formulario con validación RUT

#### 3.3.6 Gestión de Contratos
- [ ] **src/app/admin/contratos/page.tsx**
  - [ ] Vista completa con nuevos campos
- [ ] **src/components/forms/ContratoForm.tsx**
  - [ ] Formulario complejo con fechas, montos, estados

### 3.4 Componentes Contratista

#### 3.4.1 Gestión de Clientes
- [ ] **src/app/contratista/clientes/page.tsx**
  - [ ] Solo clientes propios
- [ ] **src/app/contratista/clientes/nuevo/page.tsx**
  - [ ] Crear cliente con validación RUT

#### 3.4.2 Gestión de Contratos
- [ ] **src/app/contratista/contratos/page.tsx**
  - [ ] Lista con filtros por estado
- [ ] **src/app/contratista/contratos/nuevo/page.tsx**
  - [ ] Formulario de contrato con unidad opcional

#### 3.4.3 Dashboard Contratista
- [ ] **src/app/contratista/dashboard/page.tsx**
  - [ ] Métricas con nuevos cálculos de comisión

### 3.5 Componentes Compartidos

#### 3.5.1 Calculadora de Comisiones
- [ ] **src/components/ComisionCalculator.tsx**
  - [ ] Widget para mostrar comisión en tiempo real

#### 3.5.2 Selectores
- [ ] **src/components/selectors/TipoUnidadSelector.tsx**
  - [ ] Dependiente de edificio seleccionado
- [ ] **src/components/selectors/ComisionSelector.tsx**
  - [ ] Para formularios de edificio/tipo unidad

## Fase 4: Testing y Validación

### 4.1 Testing Backend
- [ ] **Tests de API** para todas las rutas nuevas/modificadas
- [ ] **Tests de validación** RUT y nuevas reglas de negocio
- [ ] **Tests de migración** con datos reales

### 4.2 Testing Frontend
- [ ] **Tests de componentes** nuevos y modificados
- [ ] **Tests de formularios** con validaciones
- [ ] **Tests E2E** flujos completos de contratista

### 4.3 Validación de Datos
- [ ] **Verificar migración** de datos existentes
- [ ] **Validar cálculos** de comisión
- [ ] **Probar flujos** end-to-end

## Fase 5: Despliegue y Cleanup

### 5.1 Preparación para Producción
- [ ] **Backup de producción**
- [ ] **Plan de rollback** en caso de problemas
- [ ] **Documentación** para usuarios finales

### 5.2 Migración a Producción
- [ ] **Ejecutar migración** en producción
- [ ] **Verificar funcionamiento** de APIs críticas
- [ ] **Monitorear** errores post-migración

### 5.3 Cleanup
- [ ] **Eliminar código obsoleto** (comentado durante migración)
- [ ] **Eliminar archivos** no utilizados
- [ ] **Actualizar documentación** técnica

## Consideraciones Especiales

### Migración de Datos Existentes
1. **Contratos existentes**: Crear clientes desde datos de contrato
2. **Unidades existentes**: Asignar a tipos de unidad genéricos inicialmente
3. **Comisiones**: Establecer valores por defecto para edificios sin comisión

### Validaciones Críticas
1. **RUT chileno**: Implementar algoritmo de validación correcto
2. **Integridad referencial**: Validar que todas las FKs existan
3. **Comisiones obligatorias**: No permitir edificios/tipos sin comisión

### Performance
1. **Índices de BD**: Agregar índices en campos de búsqueda frecuente
2. **Caching**: Implementar cache para cálculos de comisión
3. **Paginación**: En listados largos de clientes/contratos

## Orden de Ejecución Recomendado

1. **Fase 1** completa (DB + seed)
2. **Comisiones** → **Edificios** → **Tipos Unidad** → **Unidades**
3. **Clientes** → **Contratos**
4. **Frontend Admin** para cada entidad
5. **Frontend Contratista**
6. **Testing** paralelo a desarrollo
7. **Despliegue** escalonado

Este plan asegura que las dependencias se resuelvan en orden y que el sistema mantenga consistencia durante todo el proceso de migración.