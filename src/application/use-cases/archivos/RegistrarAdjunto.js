import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';
import { Adjunto } from '../../../domain/entities/Adjunto.js';

/** Después de subir a Cloudinary, se pega la foto a la nota. */
export class RegistrarAdjunto extends UseCase {
  constructor({ acceso, notas, adjuntos, avisos }) {
    super();
    this.acceso = acceso;
    this.notas = notas;
    this.adjuntos = adjuntos;
    this.avisos = avisos;
  }

  async ejecutar({ actor, tableroId, notaId, ...archivo }) {
    await this.acceso.exigir(tableroId, actor.id);
    const nota = await this.notas.porId(notaId, tableroId);
    if (!nota) throw new NoEncontradoError('Nota no encontrada');

    const adjunto = await this.adjuntos.crear(
      Adjunto.registrar({ ...archivo, tableroId, notaId, subidoPor: actor.id }, { cuantosTiene: nota.adjuntos.length }),
    );
    this.avisos.publicar(tableroId, 'nota:actualizada', await this.notas.porId(notaId, tableroId));
    return adjunto;
  }
}
