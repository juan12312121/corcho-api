import { noImplementado } from './noImplementado.js';

/** Fotos de tickets pegadas a notas. */
export class AdjuntoRepository {
  /** @returns {Promise<Adjunto|null>} */
  async porId(_id, _tableroId) {
    return noImplementado('AdjuntoRepository', 'porId');
  }

  /** @returns {Promise<Adjunto[]>} */
  async deNota(_notaId) {
    return noImplementado('AdjuntoRepository', 'deNota');
  }

  /** Todas las del tablero (para borrarlas de Cloudinary). @returns {Promise<Adjunto[]>} */
  async deTablero(_tableroId) {
    return noImplementado('AdjuntoRepository', 'deTablero');
  }

  /** @returns {Promise<Adjunto>} */
  async crear(_adjunto) {
    return noImplementado('AdjuntoRepository', 'crear');
  }

  async borrar(_id) {
    return noImplementado('AdjuntoRepository', 'borrar');
  }
}
