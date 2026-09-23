import { noImplementado } from './noImplementado.js';

/** Membresías de usuarios en tableros. */
export class MiembroRepository {
  /** @returns {Promise<Miembro|null>} */
  async de(_tableroId, _usuarioId) {
    return noImplementado('MiembroRepository', 'de');
  }

  /** Miembros con nombre, email, color, avatar y datos para recibir pagos (CLABE). @returns {Promise<object[]>} */
  async listarConUsuarios(_tableroId) {
    return noImplementado('MiembroRepository', 'listarConUsuarios');
  }

  /** { tableroId, usuarioId, nombre, telefono, avisosWhatsapp } de varios tableros (solo para avisos). @returns {Promise<object[]>} */
  async contactosParaAvisos(_tableroIds) {
    return noImplementado('MiembroRepository', 'contactosParaAvisos');
  }

  /** Ids de usuario en orden de llegada. @returns {Promise<string[]>} */
  async idsDe(_tableroId) {
    return noImplementado('MiembroRepository', 'idsDe');
  }

  /** @returns {Promise<Miembro>} */
  async crear(_miembro) {
    return noImplementado('MiembroRepository', 'crear');
  }

  /** @returns {Promise<Miembro>} */
  async guardar(_miembro) {
    return noImplementado('MiembroRepository', 'guardar');
  }

  async borrar(_id) {
    return noImplementado('MiembroRepository', 'borrar');
  }
}
