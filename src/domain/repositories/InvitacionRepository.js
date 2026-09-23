import { noImplementado } from './noImplementado.js';

/** Invitaciones a tableros compartidos. */
export class InvitacionRepository {
  /** @returns {Promise<Invitacion|null>} */
  async porId(_id, _tableroId) {
    return noImplementado('InvitacionRepository', 'porId');
  }

  /** { bloquear: true } la toma con candado dentro de una transacción. @returns {Promise<Invitacion|null>} */
  async porCodigo(_codigo, _opciones) {
    return noImplementado('InvitacionRepository', 'porCodigo');
  }

  /** @returns {Promise<Invitacion[]>} */
  async listar(_tableroId) {
    return noImplementado('InvitacionRepository', 'listar');
  }

  /** @returns {Promise<Invitacion>} */
  async crear(_invitacion) {
    return noImplementado('InvitacionRepository', 'crear');
  }

  /** @returns {Promise<Invitacion>} */
  async guardar(_invitacion) {
    return noImplementado('InvitacionRepository', 'guardar');
  }

  /** Datos públicos: tablero, quién invita, cuántos son. @returns {Promise<object|null>} */
  async vistaPrevia(_codigo) {
    return noImplementado('InvitacionRepository', 'vistaPrevia');
  }

  /** Invitaciones personales vigentes para ese correo. @returns {Promise<object[]>} */
  async pendientesPara(_email) {
    return noImplementado('InvitacionRepository', 'pendientesPara');
  }

  /** Cancela todas las pendientes del tablero. */
  async cancelarPendientes(_tableroId) {
    return noImplementado('InvitacionRepository', 'cancelarPendientes');
  }
}
