import { UseCase } from '../../shared/UseCase.js';
import { registrarCobro } from './registrarCobro.js';

/** Al regresar de la página de pago: si ya se cobró, deja el pago registrado (no depende del webhook). */
export class VerificarPagoConTarjeta extends UseCase {
  constructor(deps) {
    super();
    this.deps = deps;
  }

  async ejecutar({ actor, tableroId, sesion }) {
    await this.deps.acceso.exigir(tableroId, actor.id);
    const { pago } = await registrarCobro(sesion, this.deps);
    return { pagado: Boolean(pago), pago: pago?.tableroId === tableroId ? pago : null };
  }
}
