import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';

export class RechazarInvitacion extends UseCase {
  constructor({ invitaciones }) {
    super();
    this.invitaciones = invitaciones;
  }

  async ejecutar({ actor, codigo }) {
    const invitacion = await this.invitaciones.porCodigo(codigo);
    if (!invitacion) throw new NoEncontradoError('Invitación no encontrada');
    invitacion.rechazarPor(actor);
    await this.invitaciones.guardar(invitacion);
  }
}
