import { BaseRouter } from '../BaseRouter.js';

/** /integraciones */
export class IntegracionRouter extends BaseRouter {
  rutas() {
    this.get('/recordatorios', 'recordatorios');
  }
}
