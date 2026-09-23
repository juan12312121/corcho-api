import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';

/** Se cancela (no se borra) para conservar el historial. */
export class CancelarInvitacion extends UseCase {
  constructor({ acceso, invitaciones }) {
    super();
    this.acceso = acceso;
    this.invitaciones = invitaciones;
  }

  async ejecutar({ actor, tableroId, invitacionId }) {
    await this.acceso.exigir(tableroId, actor.id, 'admin');
    const invitacion = await this.invitaciones.porId(invitacionId, tableroId);
    if (!invitacion) throw new NoEncontradoError('Invitación no encontrada');
    invitacion.cancelar();
    await this.invitaciones.guardar(invitacion);
  }
}
