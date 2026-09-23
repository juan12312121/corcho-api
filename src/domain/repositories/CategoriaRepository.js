import { noImplementado } from './noImplementado.js';

/** Categorías de gasto de cada tablero. */
export class CategoriaRepository {
  /** @returns {Promise<Categoria|null>} */
  async porId(_id, _tableroId) {
    return noImplementado('CategoriaRepository', 'porId');
  }

  /** Ordenadas por nombre. @returns {Promise<Categoria[]>} */
  async listar(_tableroId) {
    return noImplementado('CategoriaRepository', 'listar');
  }

  /** @returns {Promise<Categoria>} */
  async crear(_categoria) {
    return noImplementado('CategoriaRepository', 'crear');
  }

  /** Varias de un jalón (las de base al crear un tablero). */
  async crearVarias(_categorias) {
    return noImplementado('CategoriaRepository', 'crearVarias');
  }

  /** @returns {Promise<Categoria>} */
  async guardar(_categoria) {
    return noImplementado('CategoriaRepository', 'guardar');
  }

  /** Las notas que la usaban quedan sin categoría. */
  async borrar(_id) {
    return noImplementado('CategoriaRepository', 'borrar');
  }
}
