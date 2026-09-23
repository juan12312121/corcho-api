import { noImplementado } from './noImplementado.js';

/** Pagos entre miembros. */
export class PagoRepository {
  /** @returns {Promise<Pago|null>} */
  async porId(_id, _tableroId) {
    return noImplementado('PagoRepository', 'porId');
  }

  /** { filtros, pagina, porPagina }. @returns {Promise<Pagina>} */
  async listar(_tableroId, _consulta) {
    return noImplementado('PagoRepository', 'listar');
  }

  /** @returns {Promise<Pago>} */
  async crear(_pago) {
    return noImplementado('PagoRepository', 'crear');
  }

  /** @returns {Promise<Pago>} */
  async guardar(_pago) {
    return noImplementado('PagoRepository', 'guardar');
  }

  async borrar(_id) {
    return noImplementado('PagoRepository', 'borrar');
  }

  /** Total confirmado que cada deudor le pagó al acreedor por esa nota. @returns {Promise<Map<string, number>>} */
  async pagadoPorUsuarioEnNota(_notaId, _acreedorId) {
    return noImplementado('PagoRepository', 'pagadoPorUsuarioEnNota');
  }

  /** @returns {Promise<boolean>} */
  async hayConfirmadosDeNota(_notaId) {
    return noImplementado('PagoRepository', 'hayConfirmadosDeNota');
  }
}
