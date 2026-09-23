import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError, ConflictoError } from '../../shared/errors.js';
import { PermisoDenegadoError } from '../../../domain/shared/errors.js';
import { resumen } from './CrearNota.js';
import { borrarArchivos } from '../archivos/BorrarAdjunto.js';

/** Quitar una nota del corcho. No se puede si ya tiene pagos confirmados (se perdería el rastro). */
export class BorrarNota extends UseCase {
  constructor({ acceso, notas, pagos, adjuntos, almacen, avisos, bitacora }) {
    super();
    this.adjuntos = adjuntos;
    this.almacen = almacen;
    this.acceso = acceso;
    this.notas = notas;
    this.pagos = pagos;
    this.avisos = avisos;
    this.bitacora = bitacora;
  }

  async ejecutar({ actor, tableroId, notaId }) {
    const { miembro } = await this.acceso.exigir(tableroId, actor.id);
    const nota = await this.notas.porId(notaId, tableroId);
    if (!nota) throw new NoEncontradoError('Nota no encontrada');
    if (!nota.puedeEditarla(miembro)) throw new PermisoDenegadoError('Solo quien creó la nota o un admin puede quitarla');
    if (await this.pagos.hayConfirmadosDeNota(notaId))
      throw new ConflictoError('TIENE_PAGOS', 'Esta nota ya tiene pagos confirmados; anúlalos antes de quitarla');

    const fotos = await this.adjuntos.deNota(notaId);
    await this.notas.borrar(notaId);
    await borrarArchivos(this.almacen, fotos);
    this.avisos.publicar(tableroId, 'nota:borrada', { id: notaId }, { cambiaBalance: nota.afectaBalance() });
    await this.bitacora.registrar(tableroId, actor.id, 'nota:borrada', resumen(nota));
  }
}
