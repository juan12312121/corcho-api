import { noImplementado } from './noImplementado.js';

/** Tokens de un solo uso para restablecer la contraseña. */
export class RecuperacionRepository {
  /** { usuarioId, tokenHash, expiraEn } */
  async crear(_recuperacion) {
    return noImplementado('RecuperacionRepository', 'crear');
  }

  /** No usada y sin vencer. @returns {Promise<{id, usuarioId}|null>} */
  async vigentePorHash(_tokenHash) {
    return noImplementado('RecuperacionRepository', 'vigentePorHash');
  }

  /** Y anula las demás del mismo usuario. */
  async marcarUsada(_id) {
    return noImplementado('RecuperacionRepository', 'marcarUsada');
  }
}
