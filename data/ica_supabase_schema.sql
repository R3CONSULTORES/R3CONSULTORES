-- 1. Tabla de Municipios
CREATE TABLE IF NOT EXISTS ica_municipios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  avisos_tableros_rate NUMERIC DEFAULT 15, -- Porcentaje (ej. 15%)
  bomberil_rate NUMERIC DEFAULT 5, -- Porcentaje (ej. 5%)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Tarifas por CIIU y Municipio
CREATE TABLE IF NOT EXISTS ica_tarifas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  municipio_id UUID REFERENCES ica_municipios(id) ON DELETE CASCADE,
  codigo_ciiu TEXT NOT NULL,
  descripcion TEXT,
  tarifa_mil NUMERIC NOT NULL, -- Tarifa x 1000 (ej. 10.0)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(municipio_id, codigo_ciiu)
);

-- 3. Datos Iniciales (Basados en tu matriz actual)
-- Nota: Esto es un ejemplo de cómo insertar los datos de tu archivo taxRules.ts
INSERT INTO ica_municipios (nombre, avisos_tableros_rate, bomberil_rate) 
VALUES 
('El Paso', 15, 10),
('Chiriguaná', 15, 5),
('La Jagua de Ibirico', 15, 5),
('Becerril', 15, 0.5),
('Agustín Codazzi', 15, 8),
('Valledupar', 15, 5)
ON CONFLICT (nombre) DO NOTHING;

-- Ejemplo de inserción de tarifas para Valledupar (CIIU 4520)
INSERT INTO ica_tarifas (municipio_id, codigo_ciiu, tarifa_mil, descripcion)
SELECT id, '4520', 7, 'Mantenimiento y reparación de vehículos automotores'
FROM ica_municipios WHERE nombre = 'Valledupar'
ON CONFLICT DO NOTHING;
