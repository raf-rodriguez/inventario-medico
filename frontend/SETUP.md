# Sistema de Inventario Fullstack - Guía de Configuración

## 📋 Requisitos Previos

- Node.js 18+ y pnpm instalados
- Base de datos Neon PostgreSQL configurada
- Cuenta en Vercel (para despliegue)

## 🚀 Configuración Local

### 1. Configurar Backend

```bash
# Navegar a la carpeta del servidor
cd server

# Instalar dependencias
pnpm install

# Crear archivo .env
cp .env.example .env
```

Edita `server/.env` y agrega tu connection string de Neon:

```env
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
JWT_SECRET=tu_secreto_jwt_super_seguro
PORT=3001
```

```bash
# Iniciar el servidor backend
pnpm run dev
```

El backend estará corriendo en `http://localhost:3001`

### 2. Configurar Frontend

```bash
# En la raíz del proyecto
# Crear archivo .env
cp .env.example .env
```

Edita `.env`:

```env
VITE_API_URL=http://localhost:3001
```

```bash
# Instalar dependencias (si no lo has hecho)
pnpm install

# Iniciar el frontend
pnpm run dev
```

El frontend estará corriendo en `http://localhost:5173`

## 🗄️ Base de Datos

Las tablas se crearán automáticamente cuando inicies el backend por primera vez.

### Crear Usuario Inicial

Puedes crear tu primer usuario de dos formas:

1. **Desde la interfaz**: Ve a `http://localhost:5173` y usa la pestaña "Registrarse"

2. **Desde la API directamente**:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 📦 Despliegue en Producción

### Backend en Vercel

1. Crea un nuevo proyecto en Vercel
2. Conecta tu repositorio
3. Configura las variables de entorno:
   - `DATABASE_URL`: Tu connection string de Neon
   - `JWT_SECRET`: Un secreto seguro
4. Configura el directorio raíz como `server`
5. Despliega

### Frontend en Vercel

1. Crea otro proyecto en Vercel
2. Conecta el mismo repositorio
3. Configura la variable de entorno:
   - `VITE_API_URL`: La URL de tu backend desplegado
4. Configura el directorio raíz como raíz del proyecto
5. Despliega

## 🔐 Seguridad

- Cambia `JWT_SECRET` a un valor aleatorio y seguro en producción
- Usa HTTPS en producción
- Configura CORS apropiadamente en el backend para tu dominio
- Nunca compartas tus credenciales de base de datos

## 📝 Uso del Sistema

### Storage Principal
- Agrega productos con nombre, cantidad y categoría
- Si el nombre ya existe, se suma la cantidad
- Puedes editar, eliminar y transferir productos

### Storage Secundario
- Recibe productos transferidos desde el principal
- Puedes editar y eliminar productos

### Medicamentos
- Cada lote crea un registro único
- Aunque el nombre sea el mismo, si el lote es diferente, se crea un nuevo registro
- Incluye fecha de expiración

### Transferencias
- Historial completo de todas las transferencias realizadas
- Registro automático con fecha y hora

### Exportación
- Descarga CSV de Storage Principal y Secundario
- Formato: Nombre, Cantidad, Categoría, Fecha

## 🛠️ Solución de Problemas

### Error de conexión a la base de datos
- Verifica que tu connection string de Neon sea correcta
- Asegúrate de incluir `?sslmode=require` al final de la URL
- Verifica que tu IP esté en la lista blanca de Neon (o permite todas las IPs)

### Error CORS
- Verifica que `VITE_API_URL` apunte al backend correcto
- En producción, actualiza la configuración de CORS en `server/src/index.ts`

### Token inválido
- Limpia el localStorage del navegador
- Vuelve a iniciar sesión

## 📞 Soporte

Si encuentras algún problema, verifica:
1. Que todas las dependencias estén instaladas
2. Que los archivos `.env` estén configurados correctamente
3. Que el backend esté corriendo antes de usar el frontend
4. Los logs de la consola del navegador y del servidor