import { UseCase } from '../../shared/UseCase.js';
import { NoVigenteError } from '../../../domain/shared/errors.js';

/** Con el token del correo se pone una contraseña nueva y se entra de una vez. */
export class RestablecerPassword extends UseCase {
  constructor({ usuarios, recuperaciones, tokensSeguros, hasher, tokens }) {
    super();
    this.usuarios = usuarios;
    this.recuperaciones = recuperaciones;
    this.tokensSeguros = tokensSeguros;
    this.hasher = hasher;
    this.tokens = tokens;
  }

  async ejecutar({ token, password }) {
    const recuperacion = await this.recuperaciones.vigentePorHash(this.tokensSeguros.hash(token));
    if (!recuperacion) throw new NoVigenteError('ENLACE_VENCIDO', 'El enlace ya se usó o venció; pide otro');

    const usuario = await this.usuarios.porId(recuperacion.usuarioId);
    usuario.cambiarPassword(await this.hasher.cifrar(password));
    const guardado = await this.usuarios.guardar(usuario);
    await this.recuperaciones.marcarUsada(recuperacion.id);
    return { token: this.tokens.firmar(guardado), usuario: guardado };
  }
}
