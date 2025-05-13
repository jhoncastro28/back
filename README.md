# Almendros - Backend

Backend desarrollado con NestJS y TypeScript.

## Requisitos previos

- Node.js v22
- npm v10 o superior
- PostgreSQL

## Configuración del proyecto

1. Clonar el repositorio e instalar dependencias:

```bash
$ git clone <url-del-repositorio>
$ cd backend-almendros
$ npm install
```

2. Configurar variables de entorno:

Crea un archivo `.env` en la raíz del proyecto idéntico al archivo `.env copy` con tus credenciales de base de datos:

```
DATABASE_URL="postgresql://usuario:contraseña@host:puerto/nombre_base_datos?schema=public"
PORT=3000
```

3. Configurar la base de datos:

```bash
$ npx prisma generate
$ npx prisma migrate dev
```

## Ejecutar el proyecto

```bash
# Desarrollo
$ npm run start

# Modo observador (recomendado)
$ npm run start:dev

# Producción
$ npm run start:prod
```

## Comandos útiles de Prisma

```bash
# Generar cliente después de cambios en el esquema
$ npx prisma generate

# Crear migración después de cambios en el esquema
$ npx prisma migrate dev --name nombre_descriptivo

# Visualizar base de datos
$ npx prisma studio
```

## Solución de problemas

Si encuentras errores TS9006 con los archivos generados por Prisma, verifica que la carpeta `generated` esté excluida en `tsconfig.json`:

```json
{
  "exclude": ["node_modules", "dist", "generated"]
}
```
