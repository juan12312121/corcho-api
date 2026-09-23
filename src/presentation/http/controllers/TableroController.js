import { BaseController } from '../BaseController.js';
import * as esquemas from '../esquemas/tableros.js';

export class TableroController extends BaseController {
  listar = this.accion('listarMisTableros', { query: esquemas.listar });
  crear = this.accion('crearTablero', { body: esquemas.crear, status: 201 });
  obtener = this.accion('obtenerTablero');
  editar = this.accion('actualizarTablero', { body: esquemas.editar });
  borrar = this.accion('borrarTablero', { status: 204 });
  cambiarTipo = this.accion('cambiarTipoTablero', { body: esquemas.cambiarTipo });
}
