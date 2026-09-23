import { BaseRouter } from '../BaseRouter.js';

/** /tableros/:tableroId/pagos (un pago no se edita: se confirma, se rechaza o se anula) */
export class PagoRouter extends BaseRouter {
  rutas() {
    this.post('/liquidar', 'liquidar');
    this.post('/tarjeta', 'pagarConTarjeta');
    // :sesion (no :sesionId): es el id de Stripe (cs_…), no un uuid
    this.post('/tarjeta/:sesion/verificar', 'verificarTarjeta');
    this.post('/:pagoId/confirmar', 'confirmar');
    this.post('/:pagoId/rechazar', 'rechazar');
    this.crud(':pagoId', ['listar', 'crear', 'borrar']);
  }
}
