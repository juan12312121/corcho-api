import { BaseController } from '../BaseController.js';
import * as esquemas from '../esquemas/pagos.js';

export class PagoController extends BaseController {
  listar = this.accion('listarPagos', { query: esquemas.filtros });
  crear = this.accion('registrarPago', { body: esquemas.registrar, status: 201 });
  /** "Pagar todo lo que debo": registra mis pagos del plan para quedar a mano */
  liquidar = this.accion('liquidarMisDeudas', { body: esquemas.liquidar, status: 201 });
  borrar = this.accion('anularPago', { status: 204 });
  confirmar = this.accion('decidirPago', { extra: () => ({ decision: 'confirmar' }) });
  rechazar = this.accion('decidirPago', { extra: () => ({ decision: 'rechazar' }) });
}
