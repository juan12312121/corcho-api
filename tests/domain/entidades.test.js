import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Tablero } from '../../src/domain/entities/Tablero.js';
import { Miembro } from '../../src/domain/entities/Miembro.js';
import { Nota } from '../../src/domain/entities/Nota.js';
import { Pago } from '../../src/domain/entities/Pago.js';
import { Invitacion } from '../../src/domain/entities/Invitacion.js';
import { Usuario } from '../../src/domain/entities/Usuario.js';
import { resumenPersonal } from '../../src/domain/services/ResumenPersonal.js';
import { ReglaDeNegocioError, PermisoDenegadoError, EstadoInvalidoError, NoVigenteError } from '../../src/domain/shared/errors.js';

const ahora = new Date('2026-09-23T12:00:00Z');
const casa = new Tablero({ id: 't1', tipo: 'compartido', nombre: 'Casa' });
const personal = new Tablero({ id: 't2', tipo: 'personal', nombre: 'Mis finanzas' });
const miembros = ['ana', 'beto', 'caro'];
const enCasa = (datos, autorId = 'ana') => Nota.crear(datos, { tablero: casa, autorId, miembrosIds: miembros, z: 1, ahora });
const enPersonal = (datos) => Nota.crear(datos, { tablero: personal, autorId: 'ana', miembrosIds: ['ana'], z: 1, ahora });

describe('Nota en tablero compartido', () => {
  test('gasto: sin participantes se reparte entre todos y paga el autor', () => {
    const n = enCasa({ titulo: 'Súper', monto: 300 });
    assert.equal(n.estado, 'pagada');
    assert.equal(n.pagadoPor, 'ana');
    assert.deepEqual(n.partes.map((p) => [p.usuarioId, p.monto, p.liquidada]), [['ana', 100, true], ['beto', 100, false], ['caro', 100, false]]);
    assert.ok(n.afectaBalance());
  });

  test('servicio sin pagador nace por pagar y no mueve el balance', () => {
    const n = enCasa({ tipo: 'servicio', titulo: 'Luz', monto: 900 });
    assert.equal(n.estado, 'por_pagar');
    assert.equal(n.pagadoPor, null);
    assert.equal(n.afectaBalance(), false);
  });

  test('no se reparte con gente que no es miembro', () => {
    assert.throws(() => enCasa({ titulo: 'x', monto: 10, participantes: [{ usuarioId: 'intruso' }] }), (e) => e.codigo === 'NO_ES_MIEMBRO');
  });

  test('deudas externas solo en tablero personal', () => {
    assert.throws(() => enCasa({ tipo: 'prestamo', titulo: 'Juan', monto: 10, contraparte: 'Juan', direccion: 'debo' }), (e) => e.codigo === 'SOLO_TABLERO_PERSONAL');
  });

  test('pagar un servicio recurrente devuelve el del siguiente periodo', () => {
    const n = enCasa({ tipo: 'servicio', titulo: 'Internet', monto: 600, fecha: '2026-09-01', venceEn: '2026-09-10', recurrencia: 'mensual' });
    const siguiente = n.pagar({ pagadoPor: 'beto', miembrosIds: miembros, ahora });
    assert.equal(n.estado, 'pagada');
    assert.equal(n.pagadoPor, 'beto');
    assert.equal(siguiente.estado, 'por_pagar');
    assert.equal(siguiente.fecha, '2026-10-01');
    assert.equal(siguiente.venceEn, '2026-10-10');
    assert.equal(siguiente.id, undefined);
    assert.throws(() => n.pagar({ pagadoPor: 'ana', miembrosIds: miembros }), EstadoInvalidoError);
  });

  test('aplicar pagos liquida partes y, al cubrir todas, la nota', () => {
    const n = enCasa({ titulo: 'Súper', monto: 300 });
    n.aplicarPagos(new Map([['beto', 100]]), ahora);
    assert.equal(n.estado, 'pagada');
    n.aplicarPagos(new Map([['beto', 100], ['caro', 100]]), ahora);
    assert.equal(n.estado, 'liquidada');
    assert.equal(n.liquidadaEn, ahora);
  });

  test('editar el monto re-reparte; con montos que ya no cuadran pide participantes', () => {
    const n = enCasa({ titulo: 'Súper', monto: 300 });
    assert.deepEqual(n.editar({ monto: 330 }, { tablero: casa, miembrosIds: miembros }), { tocaDinero: true });
    assert.deepEqual(n.partes.map((p) => p.monto), [110, 110, 110]);
    const m = enCasa({ titulo: 'Cena', monto: 300, modoReparto: 'montos', participantes: [{ usuarioId: 'ana', monto: 100 }, { usuarioId: 'beto', monto: 200 }] });
    assert.throws(() => m.editar({ monto: 400 }, { tablero: casa, miembrosIds: miembros }), (e) => e.codigo === 'PARTICIPANTES_REQUERIDOS');
    assert.deepEqual(m.editar({ color: 'rosa' }, { tablero: casa, miembrosIds: miembros }), { tocaDinero: false });
  });

  test('solo el autor o un admin la edita', () => {
    const n = enCasa({ titulo: 'Súper', monto: 300 });
    assert.ok(n.puedeEditarla(Miembro.nuevo('t1', 'ana')));
    assert.ok(!n.puedeEditarla(Miembro.nuevo('t1', 'beto')));
    assert.ok(n.puedeEditarla(Miembro.nuevo('t1', 'caro', 'admin')));
  });
});

describe('Nota en tablero personal', () => {
  test('un gasto es solo mío y no se reparte', () => {
    const n = enPersonal({ titulo: 'Gasolina', monto: 800, categoriaId: 'auto' });
    assert.deepEqual(n.partes.map((p) => p.usuarioId), ['ana']);
    assert.equal(n.estado, 'pagada');
    assert.throws(() => enPersonal({ titulo: 'x', monto: 10, participantes: [{ usuarioId: 'ana' }] }), (e) => e.codigo === 'SOLO_TABLERO_COMPARTIDO');
  });

  test('deuda externa con abonos hasta liquidarla', () => {
    const n = enPersonal({ tipo: 'prestamo', titulo: 'Préstamo de Juan', monto: 500, contraparte: 'Juan', direccion: 'debo' });
    assert.equal(n.esDeudaExterna(), true);
    assert.equal(n.afectaBalance(), false);
    n.abonar(200, ahora);
    assert.equal(n.restante(), 300);
    assert.throws(() => n.abonar(301), (e) => e.codigo === 'ABONO_EXCEDE');
    n.abonar(300, ahora);
    assert.equal(n.estado, 'liquidada');
    assert.throws(() => n.abonar(1), EstadoInvalidoError);
  });

  test('un préstamo personal necesita contraparte', () => {
    assert.throws(() => enPersonal({ tipo: 'prestamo', titulo: 'x', monto: 10 }), (e) => e.codigo === 'CONTRAPARTE_REQUERIDA');
  });

  test('resumen del mes', () => {
    const notas = [
      enPersonal({ titulo: 'Súper', monto: 1200, categoriaId: 'super', fecha: '2026-09-05' }),
      enPersonal({ titulo: 'Gasolina', monto: 800, categoriaId: 'auto', fecha: '2026-09-10' }),
      enPersonal({ titulo: 'Agosto', monto: 999, categoriaId: 'super', fecha: '2026-08-30' }),
      enPersonal({ tipo: 'servicio', titulo: 'Luz', monto: 450, venceEn: '2026-09-20' }),
      enPersonal({ tipo: 'servicio', titulo: 'Agua', monto: 200, venceEn: '2026-09-26' }),
      enPersonal({ tipo: 'prestamo', titulo: 'Juan', monto: 500, contraparte: 'Juan', direccion: 'debo' }),
      enPersonal({ tipo: 'prestamo', titulo: 'Mamá', monto: 300, contraparte: 'Mamá', direccion: 'me_deben' }),
    ];
    const r = resumenPersonal(notas, ahora);
    assert.equal(r.gastadoMes, 2000);
    assert.deepEqual(r.porCategoria, [{ categoriaId: 'super', total: 1200 }, { categoriaId: 'auto', total: 800 }]);
    assert.deepEqual(r.porPagar, { total: 650, cantidad: 2 });
    assert.deepEqual(r.vencidas, { total: 450, cantidad: 1 });
    assert.equal(r.proximas.cantidad, 1);
    assert.equal(r.debo, 500);
    assert.equal(r.meDeben, 300);
  });
});

describe('Tablero y miembros', () => {
  test('un personal no admite invitados; uno compartido no vuelve a personal con gente', () => {
    assert.throws(() => personal.exigirCompartido(), (e) => e.codigo === 'TABLERO_PERSONAL');
    const t = Tablero.crear({ nombre: 'Viaje', propietarioId: 'ana' });
    assert.throws(() => t.cambiarTipo('personal', { cantidadMiembros: 2 }), ReglaDeNegocioError);
    t.cambiarTipo('personal', { cantidadMiembros: 1 });
    assert.ok(t.esPersonal());
  });

  test('reglas para sacar miembros', () => {
    const duena = Miembro.propietario('t', 'ana');
    const admin = Miembro.nuevo('t', 'beto', 'admin');
    const caro = Miembro.nuevo('t', 'caro');
    assert.ok(caro.puedeSacarA(caro));
    assert.ok(!caro.puedeSacarA(admin));
    assert.ok(admin.puedeSacarA(caro));
    assert.ok(!admin.puedeSacarA(Miembro.nuevo('t', 'dani', 'admin')));
    assert.ok(duena.puedeSacarA(admin));
    assert.ok(!admin.puedeSacarA(duena));
  });
});

describe('Pago', () => {
  const nota = enCasa({ titulo: 'Súper', monto: 300 });
  nota.id = 'n1';
  const registrar = (datos, autorId) => Pago.registrar(datos, { tableroId: 't1', autorId, miembrosIds: miembros, nota, ahora });

  test('quien paga lo registra pendiente; quien recibe, confirmado', () => {
    assert.equal(registrar({ aUsuarioId: 'ana', monto: 100 }, 'beto').estado, 'pendiente');
    assert.equal(registrar({ deUsuarioId: 'beto', aUsuarioId: 'ana', monto: 100 }, 'ana').estado, 'confirmado');
  });

  test('solo quien recibe confirma; nadie registra pagos ajenos', () => {
    const p = registrar({ aUsuarioId: 'ana', monto: 100 }, 'beto');
    assert.throws(() => p.confirmar('beto'), PermisoDenegadoError);
    p.confirmar('ana');
    assert.throws(() => p.rechazar('ana'), EstadoInvalidoError);
    assert.throws(() => registrar({ deUsuarioId: 'beto', aUsuarioId: 'ana', monto: 1 }, 'caro'), PermisoDenegadoError);
  });

  test('el abono a una nota va para quien la pagó', () => {
    assert.throws(() => registrar({ aUsuarioId: 'caro', monto: 100, notaId: 'n1' }, 'beto'), (e) => e.codigo === 'ABONO_A_OTRO');
  });
});

describe('Invitación', () => {
  const base = { tableroId: 't', invitadoPor: 'ana', codigo: 'X', dias: 7, ahora };

  test('personal: un uso y solo para su correo', () => {
    const inv = Invitacion.crear({ ...base, email: 'Caro@Mail.com' });
    assert.equal(inv.usosMax, 1);
    assert.throws(() => inv.exigirAceptablePor({ email: 'otro@mail.com' }, ahora), PermisoDenegadoError);
    inv.exigirAceptablePor({ email: 'caro@mail.com' }, ahora);
    inv.registrarUso();
    assert.equal(inv.estado, 'aceptada');
  });

  test('enlace abierto vence', () => {
    const inv = Invitacion.crear({ ...base, usosMax: 5 });
    assert.throws(() => inv.exigirAceptablePor({ email: 'x@y.com' }, new Date('2026-10-30')), NoVigenteError);
  });
});

test('Usuario no expone su passwordHash', () => {
  const u = Usuario.registrar({ nombre: ' Ana ', email: 'ANA@X.COM', passwordHash: 'h' });
  assert.equal(u.nombre, 'Ana');
  assert.equal(u.email, 'ana@x.com');
  assert.equal(JSON.parse(JSON.stringify(u)).passwordHash, undefined);
});
