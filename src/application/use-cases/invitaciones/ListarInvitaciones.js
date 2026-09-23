import { UseCase } from '../../shared/UseCase.js';

export class ListarInvitaciones extends UseCase {
  constructor({ acceso, invitaciones }) {
    super();
    this.acceso = acceso;
    this.invitaciones = invitaciones;
  }

  async ejecutar({ actor, tableroId }) {
    await this.acceso.exigir(tableroId, actor.id, 'admin');
    return this.invitaciones.listar(tableroId);
  }
}
