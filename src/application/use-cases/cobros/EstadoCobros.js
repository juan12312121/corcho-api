import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';

/** ¿Ya puedo cobrar con tarjeta? Pregunta a la pasarela y lo guarda (así los demás ven el botón de pagar). */
export class EstadoCobros extends UseCase {
  constructor({ usuarios, pasarela }) {
    super();
    this.usuarios = usuarios;
    this.pasarela = pasarela;
  }

  async ejecutar({ actor }) {
    const disponible = this.pasarela.estaConfigurada();
    const usuario = await this.usuarios.porId(actor.id);
    if (!usuario) throw new NoEncontradoError('Tu cuenta ya no existe');
    if (!disponible || !usuario.stripeCuentaId) return { disponible, conectado: false, listo: false, panel: null };

    const { listo } = await this.pasarela.estadoCuenta(usuario.stripeCuentaId);
    if (listo !== usuario.stripeListo) {
      usuario.marcarCobros(listo);
      await this.usuarios.guardar(usuario);
    }
    return { disponible, conectado: true, listo, panel: listo ? await this.pasarela.enlacePanel(usuario.stripeCuentaId) : null };
  }
}
