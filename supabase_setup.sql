-- ==========================================
-- Configuración Backend Supabase - R3 Consultores
-- ==========================================

-- 1. Crear tabla de clientes
CREATE TABLE clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre_completo TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT NOT NULL,
    nombre_empresa TEXT,
    fecha_registro TIMESTAMPTZ DEFAULT now()
);

-- 2. Crear tabla de citas
CREATE TABLE citas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    fecha_hora_propuesta TIMESTAMPTZ NOT NULL,
    motivo_consulta TEXT NOT NULL,
    resumen_ia_necesidad TEXT,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'cancelada', 'completada')),
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- Configuración de Seguridad (RLS)
-- ==========================================

-- Habilitar Row Level Security en ambas tablas
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

-- Políticas para 'anon' (Clave pública del frontend): 
-- SOLO se permite insertar datos, preveniendo lecturas no autorizadas.

CREATE POLICY "Permitir inserción pública en clientes" 
    ON clientes FOR INSERT 
    TO anon 
    WITH CHECK (true);

CREATE POLICY "Permitir inserción pública en citas" 
    ON citas FOR INSERT 
    TO anon 
    WITH CHECK (true);

-- Nota: Para ver o modificar estos datos desde el dashboard administrativo de tu app o Next.js, 
-- usa el rol autenticado o la 'service_role' key.
