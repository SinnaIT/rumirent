-- Script de inicialización para PostgreSQL
-- Se ejecuta automáticamente al crear el contenedor

-- Crear extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configurar timezone
SET timezone = 'America/Santiago';

-- Crear usuario adicional para desarrollo (opcional)
-- CREATE USER developer WITH PASSWORD 'dev_password';
-- GRANT ALL PRIVILEGES ON DATABASE contractor_db_dev TO developer;

-- Log de inicialización
DO $$
BEGIN
    RAISE NOTICE 'Base de datos inicializada correctamente para Rumirent App';
    RAISE NOTICE 'Timezone configurado: %', current_setting('timezone');
    RAISE NOTICE 'Extensiones instaladas: uuid-ossp, pgcrypto';
END $$;