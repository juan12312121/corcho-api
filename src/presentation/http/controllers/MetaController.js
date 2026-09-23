import { BaseController } from '../BaseController.js';
import * as esquemas from '../esquemas/metas.js';

export class MetaController extends BaseController {
  listar = this.accion('listarMetas');
  crear = this.accion('crearMeta', { body: esquemas.crear, status: 201 });
  aportar = this.accion('aportarMeta', { body: esquemas.aportar, status: 201 });
  borrar = this.accion('borrarMeta', { status: 204 });
}
