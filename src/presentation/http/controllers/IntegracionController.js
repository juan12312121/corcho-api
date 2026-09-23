import { BaseController } from '../BaseController.js';
import * as esquemas from '../esquemas/integraciones.js';

/** Rutas para automatizaciones (n8n). No usan sesión de usuario sino X-Integracion-Token. */
export class IntegracionController extends BaseController {
  recordatorios = this.accion('recordatoriosDelDia', { query: esquemas.recordatorios });
}
