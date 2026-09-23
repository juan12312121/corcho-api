import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Tablero } from '../../src/domain/entities/Tablero.js';
import { Nota } from '../../src/domain/entities/Nota.js';
import { Categoria } from '../../src/domain/entities/Categoria.js';
import { mensualidades, mensualidadesCubiertas, fechaDeMensualidad } from '../../src/domain/services/PlanMeses.js';
import { resumenPlanes } from '../../src/domain/services/ResumenPlanes.js';
import { ReglaDeNegocioError } from '../../src/domain/shared/errors.js';

const ahora = new Date('2026-09-23T12:00:00Z');
const casa = new Tablero({ id: 't1', tipo: 'compartido', nombre: 'Casa' });
const personal = new Tablero({ id: 't2', tipo: 'personal', nombre: 'Mis finanzas' });
const miembros = ['ana', 'beto'];
const enCasa = (datos) => Nota.crear(datos, { tablero: casa, autorId: 'ana', miembrosIds: miembros, z: 1, ahora });
const enPersonal = (datos) => Nota.crear(datos, { tablero: personal, autorId: 'ana', miembrosIds: ['ana'], z: 1, ahora });

describe('PlanMeses', () => {
  test('las mensualidades siempre suman el total (centavos en las primeras)', () => {
    assert.deepEqual(mensualidades(1000, 3), [333.34, 333.33, 333.33]);
    assert.equal(Math.round(mensualidades(12999.99, 12).reduce((a, b) => a + b * 100, 0)) / 100, 12999.99);
    assert.throws(() => mensualidades(100, 1), ReglaDeNegocioError);
    assert.throws(() => mensualidades(100, 61), ReglaDeNegocioError);
  });

  test('mensualidades cubiertas y fechas mes a mes', () => {
    assert.equal(mensualidadesCubiertas(600, 6, 250), 2);
    assert.equal(mensualidadesCubiertas(600, 6, 600), 6);
    assert.equal(fechaDeMensualidad('2026-01-31', 2), '2026-02-28');
    assert.equal(fechaDeMensualidad('2026-09-15', 4), '2026-12-15');
  });
});

describe('Compra a meses', () => {
  test('una tele de $12,000 a 12 meses se clava como mensualidad 1 de 12, por pagar', () => {
    const tele = enCasa({ titulo: 'Tele', monto: 12000, plazoMeses: 12, venceEn: '2026-10-05' });
    assert.equal(tele.monto, 1000);
    assert.equal(tele.montoPlan, 12000);
    assert.equal(tele.numeroCuota, 1);
    assert.equal(tele.estado, 'por_pagar');
    assert.equal(tele.recurrencia, 'mensual');
    assert.ok(tele.planId);
    assert.deepEqual(tele.partes.map((p) => p.monto), [500, 500]);
  });

  test('al pagar una mensualidad se clava la siguiente; en la última ya no', () => {
    let cuota = enCasa({ titulo: 'Refri', monto: 1000, plazoMeses: 3, venceEn: '2026-10-05' });
    const planId = cuota.planId;
    const montos = [];
    for (let k = 1; k <= 3; k++) {
      montos.push(cuota.monto);
      const siguiente = cuota.pagar({ pagadoPor: 'beto', miembrosIds: miembros, ahora });
      assert.equal(cuota.estado, 'pagada');
      if (k < 3) {
        assert.equal(siguiente.numeroCuota, k + 1);
        assert.equal(siguiente.planId, planId);
        assert.equal(siguiente.estado, 'por_pagar');
        assert.equal(Math.round(siguiente.partes.reduce((a, p) => a + p.monto * 100, 0)) / 100, siguiente.monto);
        cuota = siguiente;
      } else {
        assert.equal(siguiente, null);
      }
    }
    assert.deepEqual(montos, [333.34, 333.33, 333.33]);
  });

  test('una mensualidad no cambia de monto al editarla', () => {
    const cuota = enCasa({ titulo: 'Laptop', monto: 6000, plazoMeses: 6 });
    assert.throws(() => cuota.editar({ monto: 2000 }, { tablero: casa, miembrosIds: miembros }), (e) => e.codigo === 'MENSUALIDAD_FIJA');
    assert.throws(() => cuota.editar({ plazoMeses: 3 }, { tablero: casa, miembrosIds: miembros }), (e) => e.codigo === 'PLAZO_SOLO_PRESTAMO');
  });

  test('en el tablero personal también (solo mías)', () => {
    const celular = enPersonal({ titulo: 'Celular', monto: 9000, plazoMeses: 18 });
    assert.equal(celular.monto, 500);
    assert.deepEqual(celular.partes.map((p) => p.usuarioId), ['ana']);
  });
});

describe('Deuda a meses', () => {
  test('préstamo entre miembros a 6 meses: lo pagado se ve en abonado', () => {
    const prestamo = enCasa({ tipo: 'prestamo', titulo: 'Préstamo a Beto', monto: 6000, plazoMeses: 6, participantes: [{ usuarioId: 'beto' }] });
    prestamo.id = 'n1';
    assert.equal(prestamo.plazoMeses, 6);
    assert.equal(prestamo.planId, null);
    assert.equal(prestamo.venceEn, '2026-10-23');
    prestamo.aplicarPagos(new Map([['beto', 2500]]), ahora);
    assert.equal(prestamo.abonado, 2500);
    const [plan] = resumenPlanes([prestamo]);
    assert.equal(plan.tipo, 'deuda');
    assert.equal(plan.pagadas, 2);
    assert.equal(plan.mensualidad, 1000);
    assert.equal(plan.proximaFecha, '2026-12-23');
  });

  test('deuda con alguien de fuera a meses, con abonos', () => {
    const juan = enPersonal({ tipo: 'prestamo', titulo: 'Juan', monto: 3000, contraparte: 'Juan', direccion: 'debo', plazoMeses: 3 });
    juan.id = 'n2';
    juan.abonar(1000, ahora);
    const [plan] = resumenPlanes([juan]);
    assert.equal(plan.pagadas, 1);
    assert.equal(plan.restante, 2000);
    assert.equal(plan.contraparte, 'Juan');
  });
});

test('resumen de planes: compra a meses con avance', () => {
  const primera = enCasa({ titulo: 'Tele', monto: 3000, plazoMeses: 3, venceEn: '2026-10-05' });
  primera.id = 'c1';
  const segunda = primera.pagar({ pagadoPor: 'ana', miembrosIds: miembros, ahora });
  segunda.id = 'c2';
  const [plan] = resumenPlanes([primera, segunda]);
  assert.equal(plan.tipo, 'compra');
  assert.equal(plan.pagadas, 1);
  assert.equal(plan.pagado, 1000);
  assert.equal(plan.restante, 2000);
  assert.equal(plan.notaId, 'c2');
  assert.equal(plan.proximaFecha, '2026-11-05');
});

describe('Categoria', () => {
  test('base, validaciones y permisos', () => {
    assert.equal(Categoria.baseDe('t1').length, 8);
    assert.throws(() => Categoria.crear({ tableroId: 't', nombre: '' }), ReglaDeNegocioError);
    assert.throws(() => Categoria.crear({ tableroId: 't', nombre: 'Mascotas', color: 'rojo' }), ReglaDeNegocioError);
    const mascotas = Categoria.crear({ tableroId: 't', nombre: ' Mascotas ', icono: 'pets', color: '#8A4FD6', creadoPor: 'beto' });
    assert.equal(mascotas.nombre, 'Mascotas');
    assert.ok(mascotas.puedeModificarla({ usuarioId: 'beto', tieneRango: () => false }));
    assert.ok(!mascotas.puedeModificarla({ usuarioId: 'caro', tieneRango: () => false }));
  });
});
