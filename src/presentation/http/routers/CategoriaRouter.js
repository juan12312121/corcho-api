import { BaseRouter } from '../BaseRouter.js';

/** /tableros/:tableroId/categorias */
export class CategoriaRouter extends BaseRouter {
  rutas() {
    this.crud(':categoriaId', ['listar', 'crear', 'editar', 'borrar']);
  }
}
