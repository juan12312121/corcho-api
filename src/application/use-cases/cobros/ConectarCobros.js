import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';
import { PasarelaNoConfiguradaError } from '../../ports/PasarelaPagos.js';

/**
 * "Quiero cobrar con tarjeta": crea (una sola vez) la cuenta de cobro de la persona
 * y devuelve el enlace donde Stripe le pide sus datos y su cuenta bancaria.
 */
export class ConectarCobros extends UseCase {
  constructor({ usuarios, pasarela, urlFrontend }) {
    super();
    this.usuarios = usuarios;
    this.pasarela = pasarela;
    this.urlFrontend = urlFrontend;
  }

  async ejecutar({ actor }) {
    if (!this.pasarela.estaConfigurada()) throw new PasarelaNoConfiguradaError();
    const usuario = await this.usuarios.porId(actor.id);
    if (!usuario) throw new NoEncontradoError('Tu cuenta ya no existe');
    if (!usuario.stripeCuentaId) {
      usuario.vincularCobros(await this.pasarela.crearCuenta({ email: usuario.email }));
      await this.usuarios.guardar(usuario);
    }
    const url = await this.pasarela.enlaceAlta(usuario.stripeCuentaId, {
      volver: `${this.urlFrontend}/perfil?cobros=listo`,
      reintentar: `${this.urlFrontend}/perfil?cobros=reintentar`,
    });
    return { url };
  }
}
