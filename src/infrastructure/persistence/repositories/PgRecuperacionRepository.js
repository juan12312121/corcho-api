import { RecuperacionRepository } from '../../../domain/repositories/RecuperacionRepository.js';
import { RecuperacionModel } from '../models/RecuperacionModel.js';

export class PgRecuperacionRepository extends RecuperacionRepository {
  constructor(db) {
    super();
    this.modelo = new RecuperacionModel(db);
  }

  async crear({ usuarioId, tokenHash, expiraEn }) {
    await this.modelo.insertar({ usuarioId, tokenHash, expiraEn });
  }

  vigentePorHash(tokenHash) {
    return this.modelo.fila(
      `SELECT id, usuario_id AS "usuarioId" FROM recuperaciones
        WHERE token_hash = $1 AND usada_en IS NULL AND expira_en > now()`,
      [tokenHash],
    );
  }

  async marcarUsada(id) {
    await this.modelo.ejecutar(
      `UPDATE recuperaciones SET usada_en = now()
        WHERE usada_en IS NULL AND usuario_id = (SELECT usuario_id FROM recuperaciones WHERE id = $1)`,
      [id],
    );
  }
}
