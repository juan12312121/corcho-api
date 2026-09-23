import { BaseController } from '../BaseController.js';
import * as esquemas from '../esquemas/actividad.js';

export class ActividadController extends BaseController {
  listar = this.accion('listarActividad', { query: esquemas.filtros });
}
