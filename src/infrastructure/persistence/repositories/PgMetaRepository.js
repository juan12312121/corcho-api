import { MetaRepository } from '../../../domain/repositories/MetaRepository.js';
import { Meta } from '../../../domain/entities/Meta.js';
import { MetaModel } from '../models/MetaModel.js';
import { MetaAporteModel } from '../models/MetaAporteModel.js';

const aEntidad = (fila) => (fila ? new Meta(fila) : null);

export class PgMetaRepository extends MetaRepository {
  constructor(db) {
    super();
    this.metas = new MetaModel(db);
    this.aportes = new MetaAporteModel(db);
  }

  async listar(tableroId) {
    return this.#conAhorrado('m.tablero_id = $1', [tableroId]);
  }

  async porId(id, tableroId) {
    return (await this.#conAhorrado('m.id = $1 AND m.tablero_id = $2', [id, tableroId]))[0] ?? null;
  }

  async crear(meta) {
    const fila = await this.metas.insertar(meta);
    return aEntidad({ ...fila, ahorrado: 0 });
  }

  async borrar(id) {
    await this.metas.borrar(id);
  }

  async agregarAporte(meta, aporte) {
    await this.aportes.insertar({ metaId: meta.id, ...aporte });
    return this.porId(meta.id, meta.tableroId);
  }

  /** Meta + total ahorrado + cuántos aportes lleva (numeric → Number lo hace el parser del pool). */
  async #conAhorrado(donde, valores) {
    const filas = await this.metas.filas(
      `SELECT ${this.metas.select('m')}, coalesce(sum(a.monto), 0)::numeric(12,2) AS ahorrado, count(a.id)::int AS aportes
         FROM metas m LEFT JOIN meta_aportes a ON a.meta_id = m.id
        WHERE ${donde}
        GROUP BY m.id
        ORDER BY m.creado_en`,
      valores,
    );
    return filas.map(aEntidad);
  }
}
