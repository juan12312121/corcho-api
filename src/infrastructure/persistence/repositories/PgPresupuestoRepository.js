import { PresupuestoRepository } from '../../../domain/repositories/PresupuestoRepository.js';
import { Presupuesto } from '../../../domain/entities/Presupuesto.js';
import { PresupuestoModel } from '../models/PresupuestoModel.js';

const aEntidad = (fila) => (fila ? new Presupuesto(fila) : null);

export class PgPresupuestoRepository extends PresupuestoRepository {
  constructor(db) {
    super();
    this.modelo = new PresupuestoModel(db);
  }

  async porCategoria(categoriaId, tableroId) {
    return aEntidad(await this.modelo.buscarUno({ categoriaId, tableroId }));
  }

  async porId(id, tableroId) {
    return aEntidad(await this.modelo.buscarUno({ id, tableroId }));
  }

  async listar(tableroId) {
    return (await this.modelo.buscar({ tableroId })).map(aEntidad);
  }

  async crear(presupuesto) {
    return aEntidad(await this.modelo.insertar(presupuesto));
  }

  async guardar(presupuesto) {
    return aEntidad(await this.modelo.actualizar(presupuesto.id, presupuesto));
  }

  async borrar(id) {
    await this.modelo.borrar(id);
  }
}
