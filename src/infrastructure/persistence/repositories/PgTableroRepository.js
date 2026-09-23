import { TableroRepository } from '../../../domain/repositories/TableroRepository.js';
import { Tablero } from '../../../domain/entities/Tablero.js';
import { TableroModel } from '../models/TableroModel.js';

const aEntidad = (fila) => (fila ? new Tablero(fila) : null);

export class PgTableroRepository extends TableroRepository {
  constructor(db) {
    super();
    this.modelo = new TableroModel(db);
  }

  async porId(id) {
    return aEntidad(await this.modelo.buscarUno({ id }));
  }

  async crear(tablero) {
    return aEntidad(await this.modelo.insertar(tablero));
  }

  async guardar(tablero) {
    return aEntidad(await this.modelo.actualizar(tablero.id, tablero));
  }

  async borrar(id) {
    await this.modelo.borrar(id);
  }

  async tocar(id) {
    await this.modelo.ejecutar(`UPDATE tableros SET actualizado_en = now() WHERE id = $1`, [id]);
  }

  /** Tarjetas de "Mis tableros": mi rol, integrantes (para los avatares) y notas abiertas. */
  resumenDeUsuario(usuarioId, { archivado = false, tipo = null } = {}) {
    return this.modelo.filas(
      `SELECT ${this.modelo.select('t')}, m.rol AS "miRol",
              (SELECT count(*)::int FROM notas n WHERE n.tablero_id = t.id AND n.estado <> 'liquidada') AS "notasAbiertas",
              (SELECT count(*)::int FROM notas n WHERE n.tablero_id = t.id AND n.estado = 'por_pagar' AND n.tipo <> 'recordatorio') AS "porPagar",
              (SELECT json_agg(json_build_object('usuarioId', u.id, 'nombre', coalesce(x.apodo, u.nombre), 'color', u.color, 'avatarUrl', u.avatar_url)
                               ORDER BY x.unido_en)
                 FROM tablero_miembros x JOIN usuarios u ON u.id = x.usuario_id WHERE x.tablero_id = t.id) AS "integrantes",
              (SELECT coalesce(json_agg(v), '[]') FROM (
                 SELECT n.titulo, n.monto, n.color, n.pin_color AS "pinColor", n.tipo, n.estado
                   FROM notas n WHERE n.tablero_id = t.id AND n.estado <> 'liquidada'
                  ORDER BY n.z DESC LIMIT 3) v) AS "vistaPrevia"
         FROM tableros t JOIN tablero_miembros m ON m.tablero_id = t.id AND m.usuario_id = $1
        WHERE t.archivado = $2 AND ($3::text IS NULL OR t.tipo = $3)
        ORDER BY (t.tipo = 'personal') DESC, t.actualizado_en DESC`,
      [usuarioId, archivado, tipo],
    );
  }
}
