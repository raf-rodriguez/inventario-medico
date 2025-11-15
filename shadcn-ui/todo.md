# Sistema de Inventario Fullstack - Plan de Desarrollo MVP

## Arquitectura
- Frontend: React + TypeScript + Shadcn-UI (Puerto 5173)
- Backend: Express + TypeScript API (Puerto 3001)
- Base de Datos: Neon PostgreSQL
- Autenticación: JWT tokens

## Estructura de Archivos a Crear

### Backend API (4 archivos)
1. **server/index.ts** - Servidor Express principal con rutas API
2. **server/db.ts** - Configuración y conexión a Neon PostgreSQL
3. **server/auth.ts** - Middleware de autenticación JWT
4. **server/package.json** - Dependencias del backend

### Frontend (4 archivos)
5. **src/lib/api.ts** - Cliente API para comunicación con backend
6. **src/contexts/AuthContext.tsx** - Context de autenticación
7. **src/pages/Login.tsx** - Página de login
8. **src/pages/Dashboard.tsx** - Dashboard principal con todas las secciones integradas

## API Endpoints del Backend

### Autenticación
- POST /api/auth/login - Login de usuario
- POST /api/auth/register - Registro (opcional)
- GET /api/auth/me - Verificar sesión

### Storage Principal
- GET /api/storage-principal - Listar todos
- POST /api/storage-principal - Agregar/Actualizar (si existe nombre, suma cantidad)
- PUT /api/storage-principal/:id - Editar
- DELETE /api/storage-principal/:id - Eliminar
- POST /api/storage-principal/transfer - Transferir al secundario

### Storage Secundario
- GET /api/storage-secundario - Listar todos
- PUT /api/storage-secundario/:id - Editar
- DELETE /api/storage-secundario/:id - Eliminar

### Medicamentos
- GET /api/medicamentos - Listar todos
- POST /api/medicamentos - Agregar (siempre crea nuevo por lote único)
- PUT /api/medicamentos/:id - Editar
- DELETE /api/medicamentos/:id - Eliminar

### Transferencias
- GET /api/transferencias - Historial completo

### Exportación
- GET /api/export/principal - Descargar CSV Storage Principal
- GET /api/export/secundario - Descargar CSV Storage Secundario

## Esquema de Base de Datos (SQL para Neon)

```sql
-- Usuarios
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Storage Principal
CREATE TABLE IF NOT EXISTS storage_principal (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  cantidad INTEGER NOT NULL,
  categoria VARCHAR(50),
  fecha_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Storage Secundario
CREATE TABLE IF NOT EXISTS storage_secundario (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  cantidad INTEGER NOT NULL,
  categoria VARCHAR(50),
  fecha_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medicamentos
CREATE TABLE IF NOT EXISTS medicamentos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  cantidad INTEGER NOT NULL,
  lote VARCHAR(50) NOT NULL UNIQUE,
  fecha_expiracion DATE NOT NULL,
  fecha_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Registro de Transferencias
CREATE TABLE IF NOT EXISTS transferencias (
  id SERIAL PRIMARY KEY,
  nombre_producto VARCHAR(100) NOT NULL,
  cantidad INTEGER NOT NULL,
  categoria VARCHAR(50),
  fecha_transferencia TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  origen VARCHAR(20) DEFAULT 'principal',
  destino VARCHAR(20) DEFAULT 'secundario'
);
```

## Variables de Entorno Necesarias

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@host/database
JWT_SECRET=tu_secreto_jwt_aqui
PORT=3001
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
```

## Flujo de Desarrollo
1. ✅ Crear backend Express con API routes
2. ✅ Configurar conexión a Neon DB
3. ✅ Implementar autenticación JWT
4. ✅ Crear endpoints para Storage Principal
5. ✅ Crear endpoints para Storage Secundario
6. ✅ Crear endpoints para Medicamentos
7. ✅ Crear endpoints para Transferencias
8. ✅ Crear frontend con integración API

## Despliegue
- Frontend: Vercel (React app)
- Backend: Vercel Serverless Functions o Railway/Render
- Base de Datos: Neon (ya configurado)