import { BaseRouter } from '../BaseRouter.js';

/** /tableros/:tableroId/presupuestos */
export class PresupuestoRouter extends BaseRouter {
  rutas() {
    this.get('/', 'listar');
    this.put('/', 'guardar');
    this.delete('/:presupuestoId', 'borrar');
  }
}
