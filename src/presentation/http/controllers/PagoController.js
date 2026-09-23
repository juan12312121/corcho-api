import { BaseController } from '../BaseController.js';
import * as esquemas from '../esquemas/pagos.js';
import * as cobros from '../esquemas/cobros.js';

export class PagoController extends BaseController {
  listar = this.accion('listarPagos', { query: esquemas.filtros });
  crear = this.accion('registrarPago', { body: esquemas.registrar, status: 201 });
  /** "Pagar todo lo que debo": registra mis pagos del plan para quedar a mano */
  liquidar = this.accion('liquidarMisDeudas', { body: esquemas.liquidar, status: 201 });
  borrar = this.accion('anularPago', { status: 204 });
  /** Abre la página de pago con tarjeta (el pago se registra cuando Stripe cobra) */
  pagarConTarjeta = this.accion('pagarConTarjeta', { body: cobros.pagar, status: 201 });
  verificarTarjeta = this.accion('verificarPagoConTarjeta');
  confirmar = this.accion('decidirPago', { extra: () => ({ decision: 'confirmar' }) });
  rechazar = this.accion('decidirPago', { extra: () => ({ decision: 'rechazar' }) });
}
