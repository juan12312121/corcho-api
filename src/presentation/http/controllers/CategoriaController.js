import { BaseController } from '../BaseController.js';
import * as esquemas from '../esquemas/categorias.js';

export class CategoriaController extends BaseController {
  listar = this.accion('listarCategorias');
  crear = this.accion('crearCategoria', { body: esquemas.crear, status: 201 });
  editar = this.accion('editarCategoria', { body: esquemas.editar });
  borrar = this.accion('borrarCategoria', { status: 204 });
}
