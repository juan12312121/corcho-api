import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';

/** Vista previa del enlace: a qué tablero invita, quién, y si sigue vigente. */
export class VerInvitacion extends UseCase {
  constructor({ invitaciones }) {
    super();
    this.invitaciones = invitaciones;
  }

  async ejecutar({ codigo }) {
    const vista = await this.invitaciones.vistaPrevia(codigo);
    if (!vista) throw new NoEncontradoError('Invitación no encontrada');
    return { ...vista, vigente: vista.estado === 'pendiente' && new Date(vista.expiraEn) > new Date() };
  }
}
