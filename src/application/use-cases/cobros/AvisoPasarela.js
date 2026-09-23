import { UseCase } from '../../shared/UseCase.js';
import { NoAutenticadoError } from '../../shared/errors.js';
import { registrarCobro } from './registrarCobro.js';

/**
 * Webhook de Stripe:
 *  - checkout.session.completed → registra el pago (ya confirmado)
 *  - account.updated            → la persona terminó (o perdió) su alta para cobrar
 */
export class AvisoPasarela extends UseCase {
  constructor(deps) {
    super();
    this.deps = deps;
  }

  async ejecutar({ cuerpo, firma }) {
    let aviso;
    try {
      aviso = this.deps.pasarela.verificarAviso(cuerpo, firma);
    } catch (e) {
      throw new NoAutenticadoError(`Aviso rechazado: ${e.message}`);
    }
    if (aviso.tipo === 'checkout.session.completed' || aviso.tipo === 'checkout.session.async_payment_succeeded') {
      await registrarCobro(aviso.objeto.id, this.deps);
    }
    if (aviso.tipo === 'account.updated') {
      const usuario = await this.deps.usuarios.porCuentaStripe(aviso.objeto.id);
      if (usuario) {
        usuario.marcarCobros(Boolean(aviso.objeto.charges_enabled && aviso.objeto.details_submitted));
        await this.deps.usuarios.guardar(usuario);
      }
    }
    return { recibido: true };
  }
}
