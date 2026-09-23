import { BaseRouter } from '../BaseRouter.js';

/** /pasarela — Stripe manda aquí sus avisos (configurar el webhook a /pasarela/stripe) */
export class PasarelaRouter extends BaseRouter {
  rutas() {
    this.post('/stripe', 'aviso');
  }
}
