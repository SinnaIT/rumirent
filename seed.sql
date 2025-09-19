-- Crear comisiones básicas para testing
INSERT INTO comisiones (id, nombre, codigo, porcentaje, activa, "createdAt", "updatedAt")
VALUES
  ('cm1', 'Comisión Estándar', 'ESTANDAR', 0.05, true, NOW(), NOW()),
  ('cm2', 'Comisión Premium', 'PREMIUM', 0.07, true, NOW(), NOW()),
  ('cm3', 'Comisión Básica', 'BASICA', 0.03, true, NOW(), NOW())
ON CONFLICT (codigo) DO NOTHING;