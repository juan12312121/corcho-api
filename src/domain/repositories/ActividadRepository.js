import { noImplementado } from './noImplementado.js';

/** Bitácora de cada tablero. */
export class ActividadRepository {
  /** @returns {Promise<Actividad>} */
  async crear(_actividad) {
    return noImplementado('ActividadRepository', 'crear');
  }

  /** { pagina, porPagina, tipo }. @returns {Promise<Pagina>} */
  async listar(_tableroId, _consulta) {
    return noImplementado('ActividadRepository', 'listar');
  }
}
