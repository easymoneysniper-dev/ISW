# Requisito 3.1 — Registro de equipos

Avance preparado sobre `main`, commit `7d360bb`, del repositorio ISW.

## Qué permite

- Entrar desde **Inventario y kits → Equipos**.
- Registrar y editar nombre, marca, modelo, número de serie, precio y fecha de compra, estado y pertenencia a un kit.
- Buscar por nombre, marca, modelo, serie o kit; filtrar por estado.
- Consultar compras por mes, con detalle, cantidad y total en pesos chilenos.
- Conservar los equipos dados de baja y sus compras.

| Rol | Consultar inventario/compras | Registrar y editar |
| --- | --- | --- |
| Jefe de Área Técnica | Sí | Sí |
| Dueño | Sí | No |
| Contador | No en este módulo | No |
| Administrador de desarrollo | Sí | Sí, como acordó el equipo |

Los permisos se comprueban en la API; ocultar botones no es la protección principal.

## Decisiones de este avance

- Nombre, precio y fecha son obligatorios. Marca, modelo y serie son opcionales.
- El precio se maneja como pesos chilenos enteros, mayores que cero, con hasta 14 dígitos; es consistente con los importes actuales del proyecto. Se conserva como Decimal en PostgreSQL, sin sumar importes con números de punto flotante.
- La serie se recorta y convierte a mayúsculas. Una serie vacía se guarda como `NULL`. Su índice único impide duplicados, incluso con peticiones simultáneas.
- La fecha de compra es de tipo `DATE`: no cambia de día por la zona horaria. No se impone una prohibición de fechas futuras porque el requisito no la especifica.
- Estados: disponible, dañado, en reparación, perdido y dado de baja. El estado inicial es disponible.
- `kitId = NULL` significa repuesto suelto. Se puede elegir un kit existente o crear un contenedor con nombre al guardar la ficha. Cada equipo pertenece a un único kit a la vez.
- El kit básico todavía no tiene clasificación, recargos, asignación a transmisiones ni comprobación de disponibilidad: esas reglas pertenecen a RF 3.2. No se presentan como implementadas.
- La compra se obtiene de la misma ficha; editar su estado no genera otra compra. Si se corrige su precio o fecha, el reporte refleja la corrección.
- El reporte incluido es el de **compras de equipos**, no el cierre mensual de finanzas ni el reporte de pérdidas/reparaciones. El servicio `comprasMensuales` queda disponible para integrarlo con esos módulos después.
- Crear/editar registra usuario, fecha, acción y equipo en `RegistroCambio`. La ficha, el kit nuevo y el registro de auditoría comparten una transacción: si falla alguno, no se guarda ninguno.

## Dónde está cada parte

| Archivo | Responsabilidad |
| --- | --- |
| `backend/prisma/schema.prisma` | Modelos `Equipo`, `Kit` y enum de estados |
| `backend/prisma/migrations/20261020_01_registro_equipos/migration.sql` | Crea las tablas, índices y relaciones |
| `backend/src/routes/equipo.routes.js` | Direcciones de la API y permisos |
| `backend/src/schemas/equipo.schema.js` | Validaciones con Zod |
| `backend/src/controllers/equipo.controller.js` | Recibe la petición y devuelve la respuesta HTTP |
| `backend/src/services/equipo.service.js` | Consultas y transacciones con Prisma |
| `frontend/src/services/equipoService.js` | Peticiones del navegador a la API |
| `frontend/src/pages/inventario/EquiposPage.jsx` | Inventario, búsqueda y acceso al formulario |
| `frontend/src/pages/inventario/EquipoForm.jsx` | Formulario de registro y edición |
| `frontend/src/pages/inventario/ComprasEquipos.jsx` | Consulta de compras por mes |
| `frontend/src/modules/inventario/index.jsx` | Conecta la pantalla con el menú existente |

Al guardar: el formulario construye un objeto → el service del frontend lo convierte a JSON → la ruta comprueba sesión y rol → Zod valida → el controller llama al service → Prisma guarda en PostgreSQL → React muestra el equipo devuelto.

## API

Todas las rutas requieren sesión con cookie y rol autorizado.

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/equipos` | Inventario completo |
| GET | `/api/equipos/kits` | Kits para el selector |
| POST | `/api/equipos` | Registrar equipo |
| PUT | `/api/equipos/:id` | Reemplazar los datos de su ficha, incluido el estado |
| GET | `/api/equipos/compras-mensuales?mes=2026-10` | Compras según fecha de compra |

Ejemplo de cuerpo para crear o editar:

```json
{
  "nombre": "Cámara principal",
  "marca": "Sony",
  "modelo": "PXW",
  "numeroSerie": "CAM-001",
  "precioCompra": "1500000",
  "fechaCompra": "2026-10-20",
  "estado": "DISPONIBLE",
  "kitId": null,
  "nuevoKitNombre": null
}
```

Para un kit existente, enviar `kitId`. Para uno nuevo, enviar `nuevoKitNombre` y `kitId: null`. No enviar ambos. No existe eliminación física: se cambia a `DADO_DE_BAJA`.

Respuestas de error: 400 datos inválidos, 401 sin sesión, 403 sin permiso, 404 equipo inexistente, 409 serie o nombre de kit repetido.

## Aplicar los archivos en Windows

El paquete contiene un parche de Git: agrega los archivos nuevos y modifica las partes necesarias de los existentes. No incluye `.env`, contraseñas, usuarios, `node_modules` ni datos de la base.

1. Guarda tu trabajo pendiente y revisa el estado antes de aplicar el parche. Desde la carpeta del proyecto:

```powershell
git status
git pull --ff-only origin main
git switch -c feat/registro-equipos
```

2. Descarga `rf31-registro-equipos.patch`. Si está en Descargas:

```powershell
git apply --check "$env:USERPROFILE\Downloads\rf31-registro-equipos.patch"
git apply "$env:USERPROFILE\Downloads\rf31-registro-equipos.patch"
git status
```

`--check` comprueba si se puede aplicar y no modifica archivos. Si indica un conflicto, detente y revisa esa salida; no fuerces ni sobrescribas cambios de un compañero. Si el archivo está en otra carpeta, cambia la ruta.

3. Detén el backend local con Ctrl+C. Desde `backend`, instala las dependencias y aplica la migración a la base configurada en tu `.env`:

```powershell
cd backend
npm.cmd ci
npx.cmd prisma validate
npx.cmd prisma migrate status
npx.cmd prisma migrate deploy
npx.cmd prisma generate
npm.cmd test
npm.cmd run dev
```

Mantén la VPN conectada si tu `.env` apunta a PostgreSQL de la universidad. **Ejecutar el backend en tu PC no cambia dónde está la base:** con esa URL, la migración y los equipos que registres serán compartidos con el equipo y el servidor. Para pruebas separadas necesitas otra base y su propia URL. No necesitas volver a crear los usuarios existentes.

La migración agrega `equipos`, `kits` y su enum. También crea `registros_cambio` solo si falta: ese modelo ya estaba en el repositorio, pero no tenía migración. No elimina datos existentes ni modifica la tabla de trabajadores. La falta de migración de `Trabajador` en el historial anterior sigue siendo un pendiente del módulo M2.

No ejecutes `prisma migrate reset` ni uses `db push` como sustituto de esta migración. Si hay tablas `equipos` o `kits` creadas por otro compañero, revisen primero su esquema antes de aplicar esta nueva migración.

4. En otra terminal, desde `frontend`:

```powershell
npm.cmd ci
npm.cmd run dev
```

Abre la dirección que indique Vite, inicia sesión y entra en **Inventario y kits → Equipos**. El frontend local debe seguir usando `VITE_API_URL=http://localhost:3000/api`.

## Comprobar el requisito

Usa una base de pruebas o registros de prueba acordados con el equipo.

1. Con Jefe Técnico o administrador de desarrollo, registra un equipo con solo nombre, precio y fecha. Debe aparecer como repuesto suelto disponible.
2. Registra otro con marca, modelo, serie y un kit nuevo. Edita después la ficha para seleccionar ese kit en otro equipo.
3. Repite la serie en otro equipo, incluso en minúsculas: debe rechazarse y conservar lo escrito en el formulario.
4. Registra varios sin serie: deben permitirse.
5. Cambia el estado a dañado, en reparación y dado de baja. Recarga: el último cambio debe persistir.
6. Consulta el mes de su fecha de compra: debe aparecer una vez con su precio. Un mes sin compras muestra cero.
7. Inicia sesión con Dueño: puede consultar, pero no aparecen acciones de registro/edición. La API también devuelve 403 si intenta escribir.

## Verificación realizada y límites

- Pruebas automatizadas del backend: validaciones, permisos HTTP, respuestas de conflicto, uso de transacción y cálculo del reporte. Se ejecutan con `npm.cmd test`; la sesión y la persistencia se simulan para no modificar una base compartida.
- Pruebas de navegación del menú: `node --test src/config/modulos.test.js` desde frontend.
- Compilación de producción y revisión de estilo de los archivos modificados.
- Prueba en navegador con API simulada: registro, kit nuevo, edición de estado, mensaje de serie duplicada conservando los datos escritos, reporte con y sin compras, Dueño sin botones de edición y vista móvil sin desborde de la página.
- Migraciones y restricciones SQL comprobadas en una base PostgreSQL embebida aislada (PGlite): series únicas/nulas, relaciones, rangos mensuales y rollback. Esto no reemplaza la prueba con Prisma conectado a la base real.
- El lint global conserva un error anterior de `react-hooks/set-state-in-effect` en `frontend/src/pages/personal/TrabajadoresPage.jsx`. Ese archivo no se modificó.
- No se aplicaron cambios a la base de la universidad, al servidor ni a GitHub desde esta preparación. La prueba real de persistencia y login se completa al ejecutar este avance en tu entorno.
