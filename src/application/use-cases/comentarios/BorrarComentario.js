import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';

export class BorrarComentario extends UseCase {
  constructor({ acceso, comentarios, eventos }) {
    super();
    this.acceso = acceso;
    this.comentarios = comentarios;
    this.eventos = eventos;
  }

  async ejecutar({ actor, tableroId, notaId, comentarioId }) {
    const { miembro } = await this.acceso.exigir(tableroId, actor.id);
    const comentario = await this.comentarios.porId(comentarioId, tableroId);
    if (!comentario || comentario.notaId !== notaId) throw new NoEncontradoError('Comentario no encontrado');
    comentario.exigirPuedeBorrar(miembro);
    await this.comentarios.borrar(comentarioId);
    this.eventos.aTablero(tableroId, 'comentario:borrado', { id: comentarioId, notaId });
  }
}
