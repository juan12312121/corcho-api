import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';

export class ListarComentarios extends UseCase {
  constructor({ acceso, notas, comentarios }) {
    super();
    this.acceso = acceso;
    this.notas = notas;
    this.comentarios = comentarios;
  }

  async ejecutar({ actor, tableroId, notaId }) {
    await this.acceso.exigir(tableroId, actor.id);
    if (!(await this.notas.porId(notaId, tableroId))) throw new NoEncontradoError('Nota no encontrada');
    return this.comentarios.deNota(notaId);
  }
}
