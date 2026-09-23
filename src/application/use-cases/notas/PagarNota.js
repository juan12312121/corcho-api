import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';
import { resumen } from './CrearNota.js';

/**
 * Registrar quién pagó un recibo "por pagar" (luz, internet...) o marcar hecho un recordatorio.
 * Si es recurrente, clava sola la nota del siguiente periodo.
 */
export class PagarNota extends UseCase {
  constructor({ acceso, miembros, notas, uow, avisos, bitacora }) {
    super();
    this.acceso = acceso;
    this.miembros = miembros;
    this.notas = notas;
    this.uow = uow;
    this.avisos = avisos;
    this.bitacora = bitacora;
  }

  async ejecutar({ actor, tableroId, notaId, pagadoPor = actor.id, fecha }) {
    await this.acceso.exigir(tableroId, actor.id);
    const nota = await this.notas.porId(notaId, tableroId);
    if (!nota) throw new NoEncontradoError('Nota no encontrada');

    const siguiente = nota.pagar({ pagadoPor, fecha, miembrosIds: await this.miembros.idsDe(tableroId) });
    const resultado = await this.uow.ejecutar(async (repos) => {
      const pagada = await repos.notas.guardar(nota);
      if (!siguiente) return { nota: pagada, siguiente: null };
      siguiente.z = await repos.notas.siguienteZ(tableroId);
      return { nota: pagada, siguiente: await repos.notas.crear(siguiente) };
    });

    this.avisos.publicar(tableroId, 'nota:actualizada', resultado.nota, { cambiaBalance: resultado.nota.afectaBalance() });
    if (resultado.siguiente) this.avisos.publicar(tableroId, 'nota:creada', resultado.siguiente);
    await this.bitacora.registrar(tableroId, actor.id, 'nota:pagada', { ...resumen(resultado.nota), pagadoPor: resultado.nota.pagadoPor });
    return resultado;
  }
}
