import { BaseRouter } from '../BaseRouter.js';

/** /tableros/:tableroId/metas */
export class MetaRouter extends BaseRouter {
  rutas() {
    this.post('/:metaId/aportes', 'aportar');
    this.crud(':metaId', ['listar', 'crear', 'borrar']);
  }
}
