import { noImplementado } from './noImplementado.js';

/** Comentarios de las notas. */
export class ComentarioRepository {
  /** @returns {Promise<Comentario|null>} */
  async porId(_id, _tableroId) {
    return noImplementado('ComentarioRepository', 'porId');
  }

  /** Con nombre y color de quien escribió, del más viejo al más nuevo. @returns {Promise<object[]>} */
  async deNota(_notaId) {
    return noImplementado('ComentarioRepository', 'deNota');
  }

  /** @returns {Promise<Comentario>} */
  async crear(_comentario) {
    return noImplementado('ComentarioRepository', 'crear');
  }

  async borrar(_id) {
    return noImplementado('ComentarioRepository', 'borrar');
  }
}
