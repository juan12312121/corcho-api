/** Puerto de lectura: los movimientos que forman el balance entre miembros. */
export class ConsultasBalance {
  /** @returns {Promise<Array<{deudor: string, acreedor: string, monto: number}>>} */
  async deudasDe(_tableroId) {
    throw new Error('ConsultasBalance.deudasDe() no está implementado');
  }

  /** @returns {Promise<Record<string, number>>} tableroId → neto del usuario */
  async netosPorTablero(_usuarioId) {
    throw new Error('ConsultasBalance.netosPorTablero() no está implementado');
  }

  /** @returns {Promise<{gastado: number, porPagar: number, vencidas: number}>} */
  async totales(_tableroId) {
    throw new Error('ConsultasBalance.totales() no está implementado');
  }
}
