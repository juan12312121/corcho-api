/** Puerto: cifrado de contraseñas. */
export class PasswordHasher {
  /** @returns {Promise<string>} */
  async cifrar(_texto) {
    throw new Error('PasswordHasher.cifrar() no está implementado');
  }

  /** @returns {Promise<boolean>} */
  async coincide(_texto, _hash) {
    throw new Error('PasswordHasher.coincide() no está implementado');
  }
}
