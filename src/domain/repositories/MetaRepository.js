import { noImplementado } from './noImplementado.js';

/** Metas de ahorro; al leerlas traen `ahorrado` (la suma de sus aportes). */
export class MetaRepository {
  /** @returns {Promise<Meta[]>} */
  async listar(_tableroId) {
    return noImplementado('MetaRepository', 'listar');
  }

  /** @returns {Promise<Meta|null>} */
  async porId(_id, _tableroId) {
    return noImplementado('MetaRepository', 'porId');
  }

  /** @returns {Promise<Meta>} */
  async crear(_meta) {
    return noImplementado('MetaRepository', 'crear');
  }

  async borrar(_id) {
    return noImplementado('MetaRepository', 'borrar');
  }

  /** Registra un aporte (o retiro, si es negativo) y devuelve la meta con su nuevo total. */
  async agregarAporte(_meta, _aporte) {
    return noImplementado('MetaRepository', 'agregarAporte');
  }
}
