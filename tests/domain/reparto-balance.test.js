import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repartir } from '../../src/domain/services/Reparto.js';
import { netos, entrePares, simplificar } from '../../src/domain/services/Balance.js';
import { siguienteFecha } from '../../src/domain/services/Recurrencia.js';
import { ReglaDeNegocioError } from '../../src/domain/shared/errors.js';

const suma = (partes) => Math.round(partes.reduce((a, p) => a + p.monto * 100, 0)) / 100;
const ids = (...u) => u.map((usuarioId) => ({ usuarioId }));

test('reparto igual: 100 entre 3 no pierde centavos', () => {
  const r = repartir(100, 'igual', ids('a', 'b', 'c'));
  assert.deepEqual(r.map((p) => p.monto), [33.34, 33.33, 33.33]);
  assert.equal(suma(r), 100);
});

test('reparto por montos debe cuadrar', () => {
  assert.deepEqual(repartir(500, 'montos', [{ usuarioId: 'a', monto: 200 }, { usuarioId: 'b', monto: 300 }]).map((p) => p.monto), [200, 300]);
  assert.throws(
    () => repartir(500, 'montos', [{ usuarioId: 'a', monto: 200 }, { usuarioId: 'b', monto: 200 }]),
    (e) => e instanceof ReglaDeNegocioError && e.codigo === 'REPARTO_NO_CUADRA',
  );
});

test('reparto por porcentaje y por proporción', () => {
  const pct = repartir(99.99, 'porcentaje', [{ usuarioId: 'a', porcentaje: 50 }, { usuarioId: 'b', porcentaje: 25 }, { usuarioId: 'c', porcentaje: 25 }]);
  assert.equal(suma(pct), 99.99);
  assert.throws(() => repartir(10, 'porcentaje', [{ usuarioId: 'a', porcentaje: 60 }]), ReglaDeNegocioError);
  assert.deepEqual(repartir(900, 'proporcion', [{ usuarioId: 'a', proporcion: 2 }, { usuarioId: 'b', proporcion: 1 }]).map((p) => p.monto), [600, 300]);
});

test('reparto rechaza vacíos y repetidos', () => {
  assert.throws(() => repartir(10, 'igual', []), ReglaDeNegocioError);
  assert.throws(() => repartir(10, 'igual', ids('a', 'a')), ReglaDeNegocioError);
});

test('balance: súper de Ana y un pago de Beto', () => {
  const deudas = [
    { deudor: 'ana', acreedor: 'ana', monto: 100 },
    { deudor: 'beto', acreedor: 'ana', monto: 100 },
    { deudor: 'caro', acreedor: 'ana', monto: 100 },
    { deudor: 'ana', acreedor: 'beto', monto: 100 }, // Beto le pagó 100 a Ana
  ];
  assert.deepEqual(netos(deudas), { ana: 100, beto: 0, caro: -100 });
  assert.deepEqual(entrePares(deudas), [{ de: 'caro', a: 'ana', monto: 100 }]);
  assert.deepEqual(simplificar(deudas), [{ de: 'caro', a: 'ana', monto: 100 }]);
});

test('simplificar: A→B→C se vuelve A→C y deja a todos en cero', () => {
  assert.deepEqual(simplificar([{ deudor: 'a', acreedor: 'b', monto: 50 }, { deudor: 'b', acreedor: 'c', monto: 50 }]), [{ de: 'a', a: 'c', monto: 50 }]);
  const deudas = [
    { deudor: 'a', acreedor: 'b', monto: 33.33 },
    { deudor: 'c', acreedor: 'b', monto: 10.01 },
    { deudor: 'b', acreedor: 'd', monto: 5 },
    { deudor: 'd', acreedor: 'a', monto: 70 },
  ];
  const pagos = simplificar(deudas);
  const tras = [...deudas, ...pagos.map((p) => ({ deudor: p.a, acreedor: p.de, monto: p.monto }))];
  for (const v of Object.values(netos(tras))) assert.equal(v, 0);
  assert.ok(pagos.length <= 3);
});

test('recurrencias, con fin de mes', () => {
  assert.equal(siguienteFecha('2026-09-23', 'semanal'), '2026-09-30');
  assert.equal(siguienteFecha('2026-09-23', 'quincenal'), '2026-10-07');
  assert.equal(siguienteFecha('2026-12-15', 'mensual'), '2027-01-15');
  assert.equal(siguienteFecha('2026-01-31', 'mensual'), '2026-02-28');
  assert.equal(siguienteFecha('2028-01-31', 'mensual'), '2028-02-29');
});
