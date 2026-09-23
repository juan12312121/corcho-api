import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';

/** Mandar una nota al archivo (o sacarla). Cualquier miembro puede ordenar el corcho. */
export class ArchivarNota extends UseCase {
  constructor({ acceso, notas, avisos }) {
    super();
    this.acceso = acceso;
    this.notas = notas;
    this.avisos = avisos;
  }

  async ejecutar({ actor, tableroId, notaId, archivada }) {
    await this.acceso.exigir(tableroId, actor.id);
    const nota = await this.notas.porId(notaId, tableroId);
    if (!nota) throw new NoEncontradoError('Nota no encontrada');
    if (archivada) nota.archivar();
    else nota.desarchivar();
    const guardada = await this.notas.guardar(nota);
    this.avisos.publicar(tableroId, 'nota:actualizada', guardada);
    return guardada;
  }
}
