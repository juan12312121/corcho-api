import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';
import { PermisoDenegadoError } from '../../../domain/shared/errors.js';
import { resumen } from './CrearNota.js';

/** Abono a una deuda con alguien de fuera ("ya le di $200 a Juan"). */
export class AbonarNota extends UseCase {
  constructor({ acceso, notas, uow, avisos, bitacora }) {
    super();
    this.acceso = acceso;
    this.notas = notas;
    this.uow = uow;
    this.avisos = avisos;
    this.bitacora = bitacora;
  }

  async ejecutar({ actor, tableroId, notaId, monto }) {
    const { miembro } = await this.acceso.exigir(tableroId, actor.id);
    const nota = await this.notas.porId(notaId, tableroId);
    if (!nota) throw new NoEncontradoError('Nota no encontrada');
    if (!nota.puedeEditarla(miembro)) throw new PermisoDenegadoError('Solo quien creó la nota puede abonarle');

    const abonado = nota.abonar(monto);
    const guardada = await this.uow.ejecutar(async (repos) => {
      await repos.notas.registrarAbono({ notaId, monto: abonado, registradoPor: actor.id });
      return repos.notas.guardar(nota);
    });

    this.avisos.publicar(tableroId, 'nota:actualizada', guardada);
    await this.bitacora.registrar(tableroId, actor.id, 'nota:abonada', { ...resumen(guardada), abono: abonado, restante: guardada.restante() });
    return guardada;
  }
}
