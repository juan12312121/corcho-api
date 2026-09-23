import { BaseController } from '../BaseController.js';
import * as esquemas from '../esquemas/presupuestos.js';

export class PresupuestoController extends BaseController {
  listar = this.accion('listarPresupuestos');
  /** Crea o cambia el tope de una categoría (uno por categoría). */
  guardar = this.accion('guardarPresupuesto', { body: esquemas.guardar });
  borrar = this.accion('borrarPresupuesto', { status: 204 });
}
