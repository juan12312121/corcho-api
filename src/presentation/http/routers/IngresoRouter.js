import { BaseRouter } from '../BaseRouter.js';

/** /tableros/:tableroId/ingresos (tablero personal) */
export class IngresoRouter extends BaseRouter {
  rutas() {
    this.crud(':ingresoId', ['listar', 'crear', 'borrar']);
  }
}
