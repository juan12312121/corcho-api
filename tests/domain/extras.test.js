import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { esClabeValida, bancoDeClabe, digitoVerificador } from '../../src/domain/shared/Clabe.js';
import { Usuario } from '../../src/domain/entities/Usuario.js';
import { Tablero } from '../../src/domain/entities/Tablero.js';
import { Nota } from '../../src/domain/entities/Nota.js';
import { Adjunto, carpetaDeTablero } from '../../src/domain/entities/Adjunto.js';
import { Comentario } from '../../src/domain/entities/Comentario.js';
import { Presupuesto } from '../../src/domain/entities/Presupuesto.js';
import { Miembro } from '../../src/domain/entities/Miembro.js';
import { resumenPresupuestos } from '../../src/domain/services/ResumenPresupuestos.js';
import { reporteDeGastos, ultimosMeses } from '../../src/domain/services/Reportes.js';
import { recordatoriosDelDia } from '../../src/domain/services/Recordatorios.js';
import { ReglaDeNegocioError, PermisoDenegadoError } from '../../src/domain/shared/errors.js';
import { publicIdDeUrl } from '../../src/application/use-cases/archivos/carpetas.js';

const ahora = new Date('2026-09-23T15:00:00Z');
const casa = new Tablero({ id: 't1', tipo: 'compartido', nombre: 'Casa' });
const personal = new Tablero({ id: 't2', tipo: 'personal', nombre: 'Mis finanzas' });
const enCasa = (datos, autorId = 'ana') => Nota.crear(datos, { tablero: casa, autorId, miembrosIds: ['ana', 'beto'], z: 1, ahora });
const enPersonal = (datos) => Nota.crear(datos, { tablero: personal, autorId: 'ana', miembrosIds: ['ana'], z: 1, ahora });
const conClabe = (primeros17) => primeros17 + digitoVerificador(primeros17);

describe('CLABE', () => {
  test('dígito verificador y banco', () => {
    const clabe = conClabe('01218000123456789');
    assert.ok(esClabeValida(clabe));
    assert.ok(!esClabeValida(clabe.slice(0, 17) + ((Number(clabe[17]) + 1) % 10)));
    assert.ok(!esClabeValida('123'));
    assert.equal(bancoDeClabe(clabe), 'BBVA');
  });
});

describe('Perfil', () => {
  const nuevo = () => Usuario.registrar({ nombre: 'Ana', email: 'ana@x.com', passwordHash: 'h' });

  test('celular a 10 dígitos lleva lada 52; avisos requieren celular', () => {
    const u = nuevo();
    assert.throws(() => u.actualizarPerfil({ avisosWhatsapp: true }), (e) => e.codigo === 'TELEFONO_REQUERIDO');
    u.actualizarPerfil({ telefono: '55 1234-5678', avisosWhatsapp: true });
    assert.equal(u.telefono, '525512345678');
    assert.ok(u.quiereAvisosWhatsapp());
    assert.throws(() => u.actualizarPerfil({ telefono: '123' }), ReglaDeNegocioError);
  });

  test('datos de pago: CLABE válida, banco deducido', () => {
    const u = nuevo();
    const buena = conClabe('07218000123456789');
    const conDigitoMalo = buena.slice(0, 17) + ((Number(buena[17]) + 1) % 10);
    assert.throws(() => u.cambiarDatosPago({ clabe: conDigitoMalo }), (e) => e.codigo === 'CLABE_INVALIDA');
    u.cambiarDatosPago({ clabe: conClabe('07218000123456789'), titularCuenta: 'Ana García' });
    assert.equal(u.banco, 'Banorte');
    u.cambiarDatosPago({ clabe: conClabe('01218000123456789'), banco: null });
    assert.equal(u.banco, 'BBVA', 'banco vacío → se deduce de la CLABE');
    u.cambiarDatosPago({ clabe: null });
    assert.equal(u.clabe, null);
  });
});

describe('Adjuntos y comentarios', () => {
  test('una foto solo se acepta si vive en la carpeta del tablero', () => {
    const base = { tableroId: 't1', notaId: 'n1', subidoPor: 'ana', url: 'https://res.cloudinary.com/demo/image/upload/v1/x.jpg' };
    assert.throws(() => Adjunto.registrar({ ...base, publicId: 'otra/carpeta/x' }, { cuantosTiene: 0 }), (e) => e.codigo === 'ADJUNTO_AJENO');
    assert.throws(() => Adjunto.registrar({ ...base, publicId: `${carpetaDeTablero('t1')}/x` }, { cuantosTiene: 6 }), (e) => e.codigo === 'DEMASIADOS_ADJUNTOS');
    const foto = Adjunto.registrar({ ...base, publicId: `${carpetaDeTablero('t1')}/x` }, { cuantosTiene: 0 });
    assert.throws(() => foto.exigirPuedeBorrar(Miembro.nuevo('t1', 'beto')), PermisoDenegadoError);
    foto.exigirPuedeBorrar(Miembro.nuevo('t1', 'caro', 'admin'));
  });

  test('menciones solo a miembros, sin repetir ni a uno mismo', () => {
    const c = Comentario.escribir({ tableroId: 't1', notaId: 'n1', usuarioId: 'ana', texto: ' @Beto ya pagué ', menciones: ['beto', 'beto', 'ana'] }, { miembrosIds: ['ana', 'beto'] });
    assert.equal(c.texto, '@Beto ya pagué');
    assert.deepEqual(c.menciones, ['beto']);
    assert.throws(() => Comentario.escribir({ tableroId: 't1', notaId: 'n1', usuarioId: 'ana', texto: 'hola', menciones: ['intruso'] }, { miembrosIds: ['ana'] }), ReglaDeNegocioError);
  });
});

describe('Cloudinary', () => {
  test('public_id desde la URL (con o sin versión)', () => {
    const base = 'https://res.cloudinary.com/demo/image/upload';
    assert.equal(publicIdDeUrl(`${base}/v1790187085/corcho/avatares/u1/abc.jpg`), 'corcho/avatares/u1/abc');
    assert.equal(publicIdDeUrl(`${base}/corcho/avatares/u1/abc.png`), 'corcho/avatares/u1/abc');
    assert.equal(publicIdDeUrl('https://otro.com/foto.jpg'), null);
    assert.equal(publicIdDeUrl(null), null);
  });
});

describe('Archivo', () => {
  test('se archiva lo que ya no tiene nada pendiente', () => {
    const gastoPersonal = enPersonal({ titulo: 'Súper', monto: 500 });
    assert.ok(gastoPersonal.puedeArchivarse());
    const porPagar = enCasa({ tipo: 'servicio', titulo: 'Luz', monto: 600 });
    assert.throws(() => porPagar.archivar(), (e) => e.codigo === 'NO_ARCHIVABLE');
    const conDeuda = enCasa({ titulo: 'Pizza', monto: 400 });
    assert.ok(!conDeuda.puedeArchivarse());
    conDeuda.aplicarPagos(new Map([['beto', 200]]), ahora);
    conDeuda.archivar();
    assert.equal(conDeuda.archivada, true);
  });
});

describe('Presupuestos', () => {
  test('avance del mes: ok, cerca (80 %) y excedido', () => {
    const notas = [
      enPersonal({ titulo: 'Súper 1', monto: 3500, categoriaId: 'super', fecha: '2026-09-02' }),
      enPersonal({ titulo: 'Súper agosto', monto: 9999, categoriaId: 'super', fecha: '2026-08-30' }),
      enPersonal({ titulo: 'Cine', monto: 700, categoriaId: 'diversion', fecha: '2026-09-10' }),
    ];
    const presupuestos = [
      Presupuesto.crear({ tableroId: 't2', categoriaId: 'super', montoMensual: 4000 }).con({ id: 'p1' }),
      Presupuesto.crear({ tableroId: 't2', categoriaId: 'diversion', montoMensual: 500 }).con({ id: 'p2' }),
      Presupuesto.crear({ tableroId: 't2', categoriaId: 'salud', montoMensual: 1000 }).con({ id: 'p3' }),
    ];
    const r = resumenPresupuestos(presupuestos, notas, ahora);
    assert.deepEqual(r.map((p) => [p.categoriaId, p.gastado, p.estado]), [['super', 3500, 'cerca'], ['diversion', 700, 'excedido'], ['salud', 0, 'ok']]);
    assert.equal(r[1].restante, -200);
    assert.throws(() => Presupuesto.crear({ tableroId: 't', categoriaId: 'c', montoMensual: 0 }), ReglaDeNegocioError);
  });
});

describe('Reportes', () => {
  test('últimos meses, por categoría y por persona', () => {
    assert.deepEqual(ultimosMeses(3, ahora), ['2026-07', '2026-08', '2026-09']);
    const notas = [
      enCasa({ titulo: 'Súper', monto: 300, categoriaId: 'super', fecha: '2026-09-05' }),
      enCasa({ titulo: 'Súper', monto: 100, categoriaId: 'super', fecha: '2026-08-05' }),
      enCasa({ titulo: 'Viejo', monto: 999, categoriaId: 'super', fecha: '2025-01-05' }),
      enCasa({ tipo: 'servicio', titulo: 'Luz', monto: 500, fecha: '2026-09-01' }), // por pagar: no cuenta
    ];
    const r = reporteDeGastos(notas, { meses: 3, ahora });
    assert.equal(r.total, 400);
    assert.deepEqual(r.porMes.map((m) => m.total), [0, 100, 300]);
    assert.deepEqual(r.porCategoria, [{ categoriaId: 'super', total: 400 }]);
    // Ana pagó los dos súper (400) y le tocaba la mitad (200): adelantó 200 de más
    assert.deepEqual(r.porPersona, [
      { usuarioId: 'ana', total: 200, pagado: 400, veces: 2, diferencia: 200 },
      { usuarioId: 'beto', total: 200, pagado: 0, veces: 0, diferencia: -200 },
    ]);
    assert.equal(r.detalle.length, 2);
  });
});

describe('Recordatorios', () => {
  const miembros = [
    { usuarioId: 'ana', nombre: 'Ana', telefono: '525511111111', avisosWhatsapp: true },
    { usuarioId: 'beto', nombre: 'Beto', telefono: '525522222222', avisosWhatsapp: true },
  ];

  test('recibo que vence mañana: a cada participante con su parte', () => {
    const luz = enCasa({ tipo: 'servicio', titulo: 'Luz', monto: 900, venceEn: '2026-09-24' }).con({ id: 'n1' });
    const otra = enCasa({ tipo: 'servicio', titulo: 'Agua', monto: 100, venceEn: '2026-09-30' }).con({ id: 'n2' });
    const avisos = recordatoriosDelDia([{ tablero: casa, notas: [luz, otra], miembros }], { diasAntes: 1, ahora });
    assert.equal(avisos.length, 2);
    assert.match(avisos[0].mensaje, /mañana vence "Luz" por \$900\.00; te tocan \$450\.00/);
  });

  test('quien no activó avisos no recibe nada', () => {
    const luz = enCasa({ tipo: 'servicio', titulo: 'Luz', monto: 900, venceEn: '2026-09-24' }).con({ id: 'n1' });
    const sinAvisos = miembros.map((m) => ({ ...m, avisosWhatsapp: m.usuarioId === 'ana' }));
    assert.deepEqual(recordatoriosDelDia([{ tablero: casa, notas: [luz], miembros: sinAvisos }], { ahora }).map((a) => a.usuarioId), ['ana']);
  });

  test('mensualidad de una deuda a meses con alguien de fuera', () => {
    const juan = enPersonal({ tipo: 'prestamo', titulo: 'Préstamo Juan', monto: 3000, contraparte: 'Juan', direccion: 'debo', plazoMeses: 3, venceEn: '2026-09-24' }).con({ id: 'n3' });
    const avisos = recordatoriosDelDia([{ tablero: personal, notas: [juan], miembros: [miembros[0]] }], { ahora });
    assert.equal(avisos.length, 1);
    assert.match(avisos[0].mensaje, /mañana le toca tu pago a Juan: mensualidad 1 de 3 de \$1,000\.00/);
  });
});
