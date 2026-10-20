# Menú y módulos

Base: commit 7d3bedf. Fuente de permisos: Requisitos por módulo – Grupo 3 (TXT).
El menú aparece tras iniciar sesión. La navegación usa hashes (#/inventario/equipos),
permite recargar, enlaces directos y Atrás/Adelante sin configurar rutas adicionales en el servidor.

## Reparto
- Gabriel: frontend/src/modules/transmisiones/index.jsx
- Teo: frontend/src/modules/personal/index.jsx
- Alexis: frontend/src/modules/inventario/index.jsx
- Alonso: frontend/src/modules/finanzas/index.jsx

Cada componente recibe modulo, accion y rol. Si accion es undefined, mostrar el índice del módulo.
Para implementar una sección, resolver accion.id en el index.jsx del módulo y devolver su componente.
Crear componentes y services propios dentro de la carpeta del módulo; usar services/api.js (pedir)
para las llamadas al backend y hooks/useSesion.js para la sesión. No duplicar el login ni modificar
el menú compartido para agregar la lógica de una acción ya declarada.

Los destinos y permisos de navegación están en frontend/src/config/modulos.js.
La pantalla compartida ModuloBase.jsx es un marcador explícito de funciones pendientes, sin datos ficticios.
TransmisionesPage.jsx se conserva como referencia del listado anterior; no es la página de inicio.

## Permisos
- Dueño: transmisiones; trabajadores, asignaciones y asistencia; consulta de equipos/kits y asignación de kits;
  consulta de pagos/resumen, acuerdos con auspiciadores y aportes no cumplidos.
- Contador: liquidación de comisiones en Personal; pagos, gastos, aportes recibidos/canjes y resumen en Finanzas.
- Jefe Técnico: equipos, kits, movimientos e incidentes/reporte en Inventario.

El Dueño NO hereda todos los permisos de escritura. Consulta no equivale a gestión.
El resumen mensual está a un enlace desde el inicio (RF 4.4).
Los enlaces manuales no permitidos muestran Acceso no permitido; las rutas desconocidas, Página no encontrada.

## Backend de los futuros módulos
Este cambio implementa navegación, no CRUD, auditoría ni nuevas APIs. El filtrado del menú NO protege datos.
Cada nueva ruta debe usar requireAuth y requireRol del backend y validar entradas con Zod.
Por ejemplo, escritura de equipos: requireRol("JEFE_TECNICO"); lectura: requireRol("DUENO", "JEFE_TECNICO").
La API de transmisiones preexistente no cambia sus permisos en esta entrega: el equipo deberá definir
proyecciones/consultas específicas para las tareas del Contador y del Jefe Técnico antes de conectarlas.
Nunca confiar en rol recibido desde el body: usar req.session.usuario.rol.
Registrar las modificaciones en el historial al implementar operaciones reales, según el requisito común.

## Verificación
Desde frontend: npm ci, npm run lint, npm run build.
Pruebas de permisos: node --test src/config/modulos.test.js.
Probar login y logout con los tres roles, navegación manual a rutas ajenas, recarga y Atrás/Adelante.
Probar con ancho móvil. Las secciones todavía muestran En preparación.
