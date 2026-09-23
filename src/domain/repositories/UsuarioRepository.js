import { noImplementado } from './noImplementado.js';

/** Usuarios registrados. */
export class UsuarioRepository {
  /** @returns {Promise<Usuario|null>} */
  async porId(_id) {
    return noImplementado('UsuarioRepository', 'porId');
  }

  /** Busca sin importar mayúsculas. @returns {Promise<Usuario|null>} */
  /** @returns {Promise<Usuario|null>} dueño de una cuenta de cobro (Stripe) */
  async porCuentaStripe(_cuentaId) {
    return noImplementado('UsuarioRepository', 'porCuentaStripe');
  }

  async porEmail(_email) {
    return noImplementado('UsuarioRepository', 'porEmail');
  }

  /** @returns {Promise<Usuario>} con id */
  async crear(_usuario) {
    return noImplementado('UsuarioRepository', 'crear');
  }

  /** Persiste los cambios del perfil/contraseña. @returns {Promise<Usuario>} */
  async guardar(_usuario) {
    return noImplementado('UsuarioRepository', 'guardar');
  }
}
