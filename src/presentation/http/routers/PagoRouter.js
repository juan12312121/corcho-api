import { BaseRouter } from '../BaseRouter.js';

/** /tableros/:tableroId/pagos (un pago no se edita: se confirma, se rechaza o se anula) */
export class PagoRouter extends BaseRouter {
  rutas() {
    this.post('/liquidar', 'liquidar');
    this.post('/:pagoId/confirmar', 'confirmar');
    this.post('/:pagoId/rechazar', 'rechazar');
    this.crud(':pagoId', ['listar', 'crear', 'borrar']);
  }
}
