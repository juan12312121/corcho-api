import { BaseController } from '../BaseController.js';
import * as esquemas from '../esquemas/ingresos.js';

export class IngresoController extends BaseController {
  listar = this.accion('listarIngresos');
  crear = this.accion('crearIngreso', { body: esquemas.crear, status: 201 });
  borrar = this.accion('borrarIngreso', { status: 204 });
}
