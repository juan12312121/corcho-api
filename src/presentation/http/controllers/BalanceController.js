import { BaseController } from '../BaseController.js';

export class BalanceController extends BaseController {
  obtener = this.accion('obtenerBalance');
}
