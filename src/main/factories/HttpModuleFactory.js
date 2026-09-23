/**
 * Fábrica de módulos HTTP: Controller(casos) → Router(controller, opciones) → express.Router.
 *
 *   HttpModuleFactory.crear(NotaController, NotaRouter, casos, { middlewares: [conSesion] })
 */
export class HttpModuleFactory {
  static crear(Controller, Router, casos, opciones = {}) {
    return new Router(new Controller(casos), opciones).registrar();
  }
}
