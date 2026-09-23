import { ComentarioRepository } from '../../../domain/repositories/ComentarioRepository.js';
import { Comentario } from '../../../domain/entities/Comentario.js';
import { ComentarioModel } from '../models/ComentarioModel.js';

const aEntidad = (fila) => (fila ? new Comentario(fila) : null);

export class PgComentarioRepository extends ComentarioRepository {
  constructor(db) {
    super();
    this.modelo = new ComentarioModel(db);
  }

  async porId(id, tableroId) {
    return aEntidad(await this.modelo.buscarUno({ id, tableroId }));
  }

  deNota(notaId) {
    return this.modelo.filas(
      `SELECT ${this.modelo.select('c')}, u.nombre AS "autor", u.color AS "color", u.avatar_url AS "avatarUrl"
         FROM comentarios c LEFT JOIN usuarios u ON u.id = c.usuario_id
        WHERE c.nota_id = $1
        ORDER BY c.creado_en`,
      [notaId],
    );
  }

  async crear(comentario) {
    return aEntidad(await this.modelo.insertar(comentario));
  }

  async borrar(id) {
    await this.modelo.borrar(id);
  }
}
