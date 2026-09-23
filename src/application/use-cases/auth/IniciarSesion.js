import { UseCase } from '../../shared/UseCase.js';
import { NoAutenticadoError } from '../../shared/errors.js';

export class IniciarSesion extends UseCase {
  constructor({ usuarios, hasher, tokens }) {
    super();
    this.usuarios = usuarios;
    this.hasher = hasher;
    this.tokens = tokens;
  }

  async ejecutar({ email, password }) {
    const usuario = await this.usuarios.porEmail(email);
    // Mismo mensaje exista o no el correo, para no revelar qué cuentas hay
    if (!usuario || !(await this.hasher.coincide(password, usuario.passwordHash)))
      throw new NoAutenticadoError('Correo o contraseña incorrectos');
    return { token: this.tokens.firmar(usuario), usuario };
  }
}
