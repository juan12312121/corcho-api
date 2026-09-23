/**
 * Casos de uso probados sin base de datos: los puertos se reemplazan por dobles en memoria.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Tablero } from '../../src/domain/entities/Tablero.js';
import { Miembro } from '../../src/domain/entities/Miembro.js';
import { AccesoTablero } from '../../src/application/services/AccesoTablero.js';
import { CrearNota } from '../../src/application/use-cases/notas/CrearNota.js';
import { QuitarMiembro } from '../../src/application/use-cases/miembros/QuitarMiembro.js';
import { CrearInvitacion } from '../../src/application/use-cases/invitaciones/CrearInvitacion.js';
import { NoEncontradoError, ConflictoError } from '../../src/application/shared/errors.js';
import { PermisoDenegadoError, ReglaDeNegocioError } from '../../src/domain/shared/errors.js';

function mundo({ tipo = 'compartido' } = {}) {
  const tablero = new Tablero({ id: 't1', nombre: 'Casa', tipo });
  const miembros = [Miembro.propietario('t1', 'ana'), Miembro.nuevo('t1', 'beto'), Miembro.nuevo('t1', 'caro')].map((m, i) => m.con({ id: `m${i}` }));
  const eventos = [];
  const repos = {
    tableros: { porId: async () => tablero, tocar: async () => {} },
    miembros: {
      de: async (_t, u) => miembros.find((m) => m.usuarioId === u) ?? null,
      idsDe: async () => miembros.map((m) => m.usuarioId),
      borrar: async (id) => miembros.splice(miembros.findIndex((m) => m.id === id), 1),
      listarConUsuarios: async () => [],
    },
    notas: { siguienteZ: async () => 7, crear: async (n) => n.con({ id: 'n1' }) },
  };
  const deps = {
    ...repos,
    acceso: new AccesoTablero(repos),
    eventos: { aTablero: (...e) => eventos.push(e), aUsuario: (...e) => eventos.push(e) },
    avisos: { publicar: (...e) => eventos.push(e) },
    bitacora: { registrar: async () => {} },
    consultasBalance: { deudasDe: async () => [{ deudor: 'caro', acreedor: 'ana', monto: 50 }] },
  };
  return { deps, eventos, miembros };
}

test('CrearNota: reparte entre miembros, la pone arriba y avisa que cambió el balance', async () => {
  const { deps, eventos } = mundo();
  const nota = await new CrearNota(deps).ejecutar({ actor: { id: 'beto' }, tableroId: 't1', titulo: 'Pizza', monto: 450 });
  assert.equal(nota.z, 7);
  assert.equal(nota.pagadoPor, 'beto');
  assert.deepEqual(nota.partes.map((p) => p.monto), [150, 150, 150]);
  assert.deepEqual(eventos[0].slice(0, 2), ['t1', 'nota:creada']);
  assert.equal(eventos[0][3].cambiaBalance, true);
});

test('CrearNota: quien no es miembro recibe 404 (no se le confirma que el tablero exista)', async () => {
  const { deps } = mundo();
  await assert.rejects(new CrearNota(deps).ejecutar({ actor: { id: 'intruso' }, tableroId: 't1', titulo: 'x', monto: 1 }), NoEncontradoError);
});

test('QuitarMiembro: nadie sale con saldo pendiente; sin saldo sí', async () => {
  const { deps, miembros } = mundo();
  const quitar = new QuitarMiembro(deps);
  await assert.rejects(quitar.ejecutar({ actor: { id: 'caro' }, tableroId: 't1' }), ConflictoError);
  await assert.rejects(quitar.ejecutar({ actor: { id: 'beto' }, tableroId: 't1', usuarioId: 'caro' }), PermisoDenegadoError);
  await quitar.ejecutar({ actor: { id: 'ana' }, tableroId: 't1', usuarioId: 'beto' });
  assert.deepEqual(miembros.map((m) => m.usuarioId), ['ana', 'caro']);
});

test('CrearInvitacion: un tablero personal no admite invitados', async () => {
  const { deps } = mundo({ tipo: 'personal' });
  const caso = new CrearInvitacion({ ...deps, usuarios: {}, invitaciones: {}, codigos: {}, diasPorDefecto: 7 });
  await assert.rejects(caso.ejecutar({ actor: { id: 'ana' }, tableroId: 't1' }), (e) => e instanceof ReglaDeNegocioError && e.codigo === 'TABLERO_PERSONAL');
});
