import { noImplementado } from './noImplementado.js';

/** Ingresos de un tablero personal. */
export class IngresoRepository {
  /** @returns {Promise<Ingreso[]>} del más reciente al más viejo */
  async listar(_tableroId) {
    return noImplementado('IngresoRepository', 'listar');
  }

  /** @returns {Promise<Ingreso|null>} */
  async porId(_id, _tableroId) {
    return noImplementado('IngresoRepository', 'porId');
  }

  /** @returns {Promise<Ingreso>} */
  async crear(_ingreso) {
    return noImplementado('IngresoRepository', 'crear');
  }

  async borrar(_id) {
    return noImplementado('IngresoRepository', 'borrar');
  }
}
