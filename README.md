# Gestión de Cobertura de Transmisiones en Vivo — Grupo 3

Aplicación web PERN (PostgreSQL, Express, React, Node) para las jefaturas de una empresa de transmisiones en vivo.

## Cómo levantarlo en local

```bash
# Backend (terminal 1)
cd backend
npm install
cp .env.example .env          # completar DATABASE_URL, SESSION_SECRET y ADMIN_*
npx prisma migrate dev        # crea las tablas
npm run crear-usuario         # crea el primer usuario (rol DUENO)
npm run dev                   # http://localhost:3000/api

# Frontend (terminal 2)
cd frontend
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:3000/api
npm run dev                   # http://localhost:5173
```

## Estructura del backend (Clases 3 y 6)

Recorrido de una petición: `routes → middlewares → controllers → services → Prisma (BD)`

| Carpeta / archivo | Qué hace |
|---|---|
| `server.js` | Carga el `.env`, comprueba la BD y abre el puerto. |
| `src/app.js` | Arma Express: CORS, JSON, Morgan, sesión, rutas `/api` y manejo de errores. |
| `src/config/` | `prisma.js` (única conexión a la BD) y `session.js` (cookie de sesión). |
| `src/routes/` | URLs y métodos HTTP. `index.js` junta todas las rutas. |
| `src/middlewares/` | `validate` (Zod → 400), `auth` (`requireAuth` → 401, `requireRol` → 403), `error` (P2002 → 409, P2025 → 404, P2003 → 400, resto → 500). |
| `src/schemas/` | Reglas de validación con Zod. |
| `src/controllers/` | Reciben la petición, llaman al service y responden. |
| `src/services/` | Reglas de negocio y consultas con Prisma. No conocen `req` ni `res`. |
| `scripts/crearUsuario.js` | Crea el primer usuario con los datos `ADMIN_*`. |

Cada recurso nuevo = modelo en `schema.prisma` + migración + `schema` + `service` + `controller` + `routes` + registro en `routes/index.js`.

## Estructura del frontend (Clase 6)

| Carpeta | Qué guarda |
|---|---|
| `pages/` | Pantallas completas (`LoginPage`, `TransmisionesPage`). |
| `services/` | Únicos archivos que llaman al backend. `api.js` es el único que lee `VITE_API_URL`. |
| `context/` | Sesión del usuario compartida por toda la app (`SesionProvider`). |
| `hooks/` | `useSesion()` para leer la sesión desde cualquier componente. |

## Endpoints actuales

| Método | Ruta | Acceso | Respuesta |
|---|---|---|---|
| GET | `/api/health` | libre | Estado del backend |
| GET | `/api/db-test` | libre | Hora del servidor PostgreSQL |
| POST | `/api/login` | libre | `{ email, password }` → usuario (200), 400, 401 |
| GET | `/api/sesion` | sesión | Usuario conectado o 401 |
| POST | `/api/logout` | libre | Cierra la sesión |
| GET | `/api/transmisiones` | sesión | Lista de transmisiones con su cliente |

## Servidor FACE

En el servidor el backend corre con `NODE_ENV=production` y `PORT=80`, y entrega también el frontend compilado (`frontend/dist`), por lo que todo funciona por un solo puerto. El frontend se compila con `VITE_API_URL=/api`.
