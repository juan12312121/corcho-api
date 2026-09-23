import { BaseRouter } from '../BaseRouter.js';

/** /tableros */
export class TableroRouter extends BaseRouter {
  rutas() {
    this.patch('/:tableroId/tipo', 'cambiarTipo');
    this.crud(':tableroId');
  }
}
