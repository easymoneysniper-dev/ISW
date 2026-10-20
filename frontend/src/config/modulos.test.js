import test from 'node:test';
import assert from 'node:assert/strict';
import { modulos, modulosPermitidos, resolverRuta } from './modulos.js';

test('cada rol accede a sus módulos y los roles desconocidos a ninguno', () => {
  assert.equal(modulosPermitidos('DUENO').length, 4);
  assert.deepEqual(modulosPermitidos('CONTADOR').map(m => m.id), ['personal', 'finanzas']);
  assert.deepEqual(modulosPermitidos('JEFE_TECNICO').map(m => m.id), ['inventario']);
  assert.deepEqual(modulosPermitidos('OTRO'), []);
});
test('enlaces directos respetan permisos de todas las acciones', () => {
  for (const modulo of modulos) for (const accion of modulo.acciones) {
    for (const rol of ['DUENO', 'CONTADOR', 'JEFE_TECNICO', 'OTRO']) {
      const ruta = resolverRuta(`#/${modulo.id}/${accion.id}`, rol);
      assert.equal(ruta.tipo, accion.roles.includes(rol) ? 'accion' : 'prohibida');
    }
  }
});
test('consulta del dueño no concede gestión y resumen tiene acceso directo', () => {
  assert.deepEqual(resolverRuta('#/inventario/equipos', 'DUENO').accion.consulta, ['DUENO']);
  assert.equal(resolverRuta('#/personal/comisiones', 'DUENO').tipo, 'prohibida');
  assert.equal(resolverRuta('#/finanzas/resumen', 'DUENO').tipo, 'accion');
  assert.equal(resolverRuta('#/finanzas/acuerdos', 'CONTADOR').tipo, 'prohibida');
});
test('rutas vacías y desconocidas', () => {
  assert.equal(resolverRuta('', 'DUENO').tipo, 'inicio');
  assert.equal(resolverRuta('#/inventado', 'DUENO').tipo, 'no-encontrada');
  assert.equal(resolverRuta('#/inventario/inventado', 'DUENO').tipo, 'no-encontrada');
  assert.equal(resolverRuta('#/inventario/equipos/extra', 'DUENO').tipo, 'no-encontrada');
});
