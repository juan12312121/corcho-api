import { noImplementado } from './noImplementado.js';

/** Topes de gasto mensual por categoría. */
export class PresupuestoRepository {
  /** @returns {Promise<Presupuesto|null>} */
  async porCategoria(_categoriaId, _tableroId) {
    return noImplementado('PresupuestoRepository', 'porCategoria');
  }

  /** @returns {Promise<Presupuesto|null>} */
  async porId(_id, _tableroId) {
    return noImplementado('PresupuestoRepository', 'porId');
  }

  /** @returns {Promise<Presupuesto[]>} */
  async listar(_tableroId) {
    return noImplementado('PresupuestoRepository', 'listar');
  }

  /** @returns {Promise<Presupuesto>} */
  async crear(_presupuesto) {
    return noImplementado('PresupuestoRepository', 'crear');
  }

  /** @returns {Promise<Presupuesto>} */
  async guardar(_presupuesto) {
    return noImplementado('PresupuestoRepository', 'guardar');
  }

  async borrar(_id) {
    return noImplementado('PresupuestoRepository', 'borrar');
  }
}
