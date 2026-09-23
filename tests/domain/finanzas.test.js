import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { conMonedaExtranjera } from '../../src/domain/services/Moneda.js';
import { misPagosParaQuedarAMano } from '../../src/domain/services/Balance.js';
import { resumenPersonal } from '../../src/domain/services/ResumenPersonal.js';
import { Meta } from '../../src/domain/entities/Meta.js';
import { Ingreso } from '../../src/domain/entities/Ingreso.js';
import { Nota } from '../../src/domain/entities/Nota.js';
import { Tablero } from '../../src/domain/entities/Tablero.js';
import { Miembro } from '../../src/domain/entities/Miembro.js';
import { Usuario } from '../../src/domain/entities/Usuario.js';
import { ReglaDeNegocioError, PermisoDenegadoError } from '../../src/domain/shared/errors.js';

const ahora = new Date('2026-09-23T15:00:00Z');
const personal = new Tablero({ id: 't2', tipo: 'personal', nombre: 'Mis finanzas', moneda: 'MXN' });
const casa = new Tablero({ id: 't1', tipo: 'compartido', nombre: 'Casa', moneda: 'MXN' });

describe('Otra moneda', () => {
  test('el monto del tablero sale de montoOriginal × tipoCambio (a centavos)', () => {
    const d = conMonedaExtranjera({ monedaOriginal: 'usd', montoOriginal: 49.99, tipoCambio: 18.2345 }, 'MXN');
    assert.deepEqual([d.monedaOriginal, d.monto], ['USD', 911.54]);
    assert.deepEqual(conMonedaExtranjera({ monedaOriginal: 'MXN', montoOriginal: 5, tipoCambio: 1 }, 'MXN').monedaOriginal, null);
    assert.throws(() => conMonedaExtranjera({ monedaOriginal: 'USD', montoOriginal: 10, tipoCambio: 0 }, 'MXN'), ReglaDeNegocioError);
  });

  test('la nota guarda lo original; cambiar el monto a mano quita la conversión', () => {
    const nota = Nota.crear({ titulo: 'Cena en NY', monedaOriginal: 'USD', montoOriginal: 50, tipoCambio: 18.2 }, { tablero: personal, autorId: 'ana', miembrosIds: ['ana'], z: 1, ahora });
    assert.deepEqual([nota.monto, nota.monedaOriginal, nota.montoOriginal], [910, 'USD', 50]);
    nota.editar({ monto: 1000 }, { tablero: personal, miembrosIds: ['ana'] });
    assert.deepEqual([nota.monto, nota.monedaOriginal, nota.tipoCambio], [1000, null, null]);
  });
});

describe('Quedar a mano con un clic', () => {
  test('solo mis pagos, menos lo que ya mandé y sigue pendiente', () => {
    const sugerencias = [
      { de: 'ana', a: 'beto', monto: 500 },
      { de: 'ana', a: 'caro', monto: 100 },
      { de: 'dani', a: 'beto', monto: 80 },
    ];
    const pendientes = [{ aUsuarioId: 'beto', monto: 200 }, { aUsuarioId: 'caro', monto: 100 }];
    assert.deepEqual(misPagosParaQuedarAMano(sugerencias, 'ana', pendientes), [{ de: 'ana', a: 'beto', monto: 300 }]);
  });
});

describe('Flujo del mes', () => {
  test('el sueldo recurrente cuenta cada mes; lo de otro mes no', () => {
    const sueldo = Ingreso.registrar({ concepto: 'Sueldo', monto: 20000, fecha: '2026-01-15', recurrente: true }, { tablero: personal, autorId: 'ana' });
    const venta = Ingreso.registrar({ concepto: 'Venta', monto: 1500, fecha: '2026-09-02' }, { tablero: personal, autorId: 'ana' });
    const vieja = Ingreso.registrar({ concepto: 'Bono', monto: 999, fecha: '2026-08-02' }, { tablero: personal, autorId: 'ana' });
    const super_ = Nota.crear({ titulo: 'Súper', monto: 3500, fecha: '2026-09-10' }, { tablero: personal, autorId: 'ana', miembrosIds: ['ana'], z: 1, ahora });
    const r = resumenPersonal([super_], ahora, [sueldo, venta, vieja]);
    assert.deepEqual([r.ingresosMes, r.gastadoMes, r.disponible], [21500, 3500, 18000]);
    assert.throws(() => Ingreso.registrar({ concepto: 'x', monto: 1 }, { tablero: casa, autorId: 'ana' }), (e) => e.codigo === 'SOLO_TABLERO_PERSONAL');
  });
});

describe('Metas de ahorro', () => {
  test('aportes y retiros sin quedar en negativo; solo autor o admin la borran', () => {
    const meta = Meta.crear({ nombre: 'Vacaciones', objetivo: 15000 }, { tableroId: 't1', autorId: 'ana' });
    meta.aportar(2000);
    meta.aportar(-500);
    assert.equal(meta.ahorrado, 1500);
    assert.throws(() => meta.aportar(-2000), (e) => e.codigo === 'RETIRO_EXCEDE');
    assert.throws(() => Meta.crear({ nombre: '', objetivo: 10 }, { tableroId: 't1', autorId: 'ana' }), ReglaDeNegocioError);
    assert.throws(() => meta.exigirPuedeBorrar(Miembro.nuevo('t1', 'beto')), PermisoDenegadoError);
    meta.exigirPuedeBorrar(Miembro.nuevo('t1', 'caro', 'admin'));
  });
});

describe('Ingreso mensual (reparto proporcional)', () => {
  test('se guarda con 2 decimales y null lo borra', () => {
    const u = Usuario.registrar({ nombre: 'Ana', email: 'a@x.com', passwordHash: 'h' });
    u.actualizarPerfil({ ingresoMensual: 25000 });
    assert.equal(u.ingresoMensual, 25000);
    assert.throws(() => u.actualizarPerfil({ ingresoMensual: -1 }), (e) => e.codigo === 'INGRESO_INVALIDO');
    u.actualizarPerfil({ ingresoMensual: null });
    assert.equal(u.ingresoMensual, null);
  });
});
