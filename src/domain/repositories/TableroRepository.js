import { noImplementado } from './noImplementado.js';

/** Tableros de corcho. */
export class TableroRepository {
  /** @returns {Promise<Tablero|null>} */
  async porId(_id) {
    return noImplementado('TableroRepository', 'porId');
  }

  /** @returns {Promise<Tablero>} */
  async crear(_tablero) {
    return noImplementado('TableroRepository', 'crear');
  }

  /** @returns {Promise<Tablero>} */
  async guardar(_tablero) {
    return noImplementado('TableroRepository', 'guardar');
  }

  /** Borra el tablero y todo lo que contiene. */
  async borrar(_id) {
    return noImplementado('TableroRepository', 'borrar');
  }

  /** Mis tableros con miRol, miembros y notasAbiertas. @returns {Promise<object[]>} */
  async resumenDeUsuario(_usuarioId, _opciones) {
    return noImplementado('TableroRepository', 'resumenDeUsuario');
  }

  /** Marca actividad reciente. */
  async tocar(_id) {
    return noImplementado('TableroRepository', 'tocar');
  }
}
