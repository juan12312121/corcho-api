import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';

export class ObtenerPerfil extends UseCase {
  constructor({ usuarios }) {
    super();
    this.usuarios = usuarios;
  }

  async ejecutar({ actor }) {
    const usuario = await this.usuarios.porId(actor.id);
    if (!usuario) throw new NoEncontradoError('Tu cuenta ya no existe');
    return usuario;
  }
}
