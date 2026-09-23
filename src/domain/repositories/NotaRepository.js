import { noImplementado } from './noImplementado.js';

/** Notas del corcho (con sus partes). */
export class NotaRepository {
  /** @returns {Promise<Nota|null>} */
  async porId(_id, _tableroId) {
    return noImplementado('NotaRepository', 'porId');
  }

  /** { filtros (con q = texto a buscar), orden, limite }. @returns {Promise<Nota[]>} */
  async listar(_tableroId, _consulta) {
    return noImplementado('NotaRepository', 'listar');
  }

  /** Guarda la nota y sus partes. @returns {Promise<Nota>} */
  async crear(_nota) {
    return noImplementado('NotaRepository', 'crear');
  }

  /** Guarda cambios de la nota y reemplaza sus partes. @returns {Promise<Nota>} */
  async guardar(_nota) {
    return noImplementado('NotaRepository', 'guardar');
  }

  /** Solo posición/rotación/z (el arrastre es frecuente). @returns {Promise<Nota>} */
  async guardarPosicion(_nota) {
    return noImplementado('NotaRepository', 'guardarPosicion');
  }

  async borrar(_id) {
    return noImplementado('NotaRepository', 'borrar');
  }

  /** z para ponerla encima de todas. @returns {Promise<number>} */
  async siguienteZ(_tableroId) {
    return noImplementado('NotaRepository', 'siguienteZ');
  }

  /** { notaId, monto, registradoPor } historial de abonos de deudas externas. */
  async registrarAbono(_abono) {
    return noImplementado('NotaRepository', 'registrarAbono');
  }

  /** Recibos por pagar que vencen en la fecha y préstamos a meses sin liquidar (todos los tableros). @returns {Promise<Nota[]>} */
  async paraRecordatorios(_fecha) {
    return noImplementado('NotaRepository', 'paraRecordatorios');
  }
}
