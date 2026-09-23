import { BaseController } from '../BaseController.js';
import * as esquemas from '../esquemas/reportes.js';

export class ReporteController extends BaseController {
  obtener = this.accion('obtenerReporte', { query: esquemas.consulta });
}
