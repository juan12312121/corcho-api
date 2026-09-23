import { BaseRouter } from '../BaseRouter.js';

/**
 * Router de una sola lectura (GET /) para recursos que solo se consultan:
 * /tableros/:tableroId/balance y /tableros/:tableroId/actividad.
 */
export class LecturaRouter extends BaseRouter {
  constructor(controller, { accion, ...opciones }) {
    super(controller, opciones);
    this.accion = accion;
  }

  rutas() {
    this.get('/', this.accion);
  }
}
