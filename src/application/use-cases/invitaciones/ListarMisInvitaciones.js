import { UseCase } from '../../shared/UseCase.js';

/** Bandeja "te invitaron": invitaciones personales vigentes a mi correo. */
export class ListarMisInvitaciones extends UseCase {
  constructor({ invitaciones }) {
    super();
    this.invitaciones = invitaciones;
  }

  async ejecutar({ actor }) {
    return this.invitaciones.pendientesPara(actor.email);
  }
}
