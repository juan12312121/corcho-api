import { ActividadRepository } from '../../../domain/repositories/ActividadRepository.js';
import { Actividad } from '../../../domain/entities/Actividad.js';
import { Pagina } from '../../../application/shared/Pagina.js';
import { ActividadModel } from '../models/ActividadModel.js';

export class PgActividadRepository extends ActividadRepository {
  constructor(db) {
    super();
    this.modelo = new ActividadModel(db);
  }

  async crear(actividad) {
    return new Actividad(await this.modelo.insertar(actividad));
  }

  async listar(tableroId, { pagina, porPagina, tipo } = {}) {
    const p = await this.modelo.paginar({ tableroId, tipo }, { pagina, porPagina });
    return new Pagina(p.items.map((f) => new Actividad(f)), p.meta);
  }
}
