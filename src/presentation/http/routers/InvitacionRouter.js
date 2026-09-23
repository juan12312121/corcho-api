import { BaseRouter } from '../BaseRouter.js';

/** /tableros/:tableroId/invitaciones (admins del tablero) */
export class InvitacionTableroRouter extends BaseRouter {
  rutas() {
    this.get('/', 'listar');
    this.post('/', 'crear');
    this.delete('/:invitacionId', 'cancelar');
  }
}

/** /invitaciones (la persona invitada) */
export class InvitacionRouter extends BaseRouter {
  rutas() {
    this.get('/pendientes', 'pendientes');
    this.get('/:codigo', 'ver');
    this.post('/:codigo/aceptar', 'aceptar');
    this.post('/:codigo/rechazar', 'rechazar');
  }
}
