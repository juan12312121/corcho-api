import { BaseController } from '../BaseController.js';

/** Avisos (webhooks) de la pasarela de pagos: sin sesión; se validan por su firma. */
export class PasarelaController extends BaseController {
  aviso = this.accion('avisoPasarela', {
    extra: (req) => ({ cuerpo: req.cuerpoCrudo?.toString('utf8') ?? '', firma: req.get('stripe-signature') }),
  });
}
