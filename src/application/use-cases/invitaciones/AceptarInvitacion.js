import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';
import { Miembro } from '../../../domain/entities/Miembro.js';

/** Entrar al tablero con el código. Si ya eras miembro, no pasa nada. */
export class AceptarInvitacion extends UseCase {
  constructor({ uow, miembros, eventos, bitacora }) {
    super();
    this.uow = uow;
    this.miembros = miembros;
    this.eventos = eventos;
    this.bitacora = bitacora;
  }

  async ejecutar({ actor, codigo }) {
    const { tableroId, yaEraMiembro } = await this.uow.ejecutar(async (repos) => {
      // Con candado: dos personas tomando el último uso a la vez no rebasan usosMax
      const invitacion = await repos.invitaciones.porCodigo(codigo, { bloquear: true });
      if (!invitacion) throw new NoEncontradoError('Invitación no encontrada');
      if (await repos.miembros.de(invitacion.tableroId, actor.id)) return { tableroId: invitacion.tableroId, yaEraMiembro: true };

      invitacion.exigirAceptablePor(actor);
      await repos.miembros.crear(Miembro.nuevo(invitacion.tableroId, actor.id, invitacion.rol));
      invitacion.registrarUso();
      await repos.invitaciones.guardar(invitacion);
      return { tableroId: invitacion.tableroId, yaEraMiembro: false };
    });

    if (!yaEraMiembro) {
      const nuevo = (await this.miembros.listarConUsuarios(tableroId)).find((m) => m.usuarioId === actor.id);
      this.eventos.aTablero(tableroId, 'miembro:entro', nuevo);
      await this.bitacora.registrar(tableroId, actor.id, 'miembro:entro', { nombre: nuevo?.nombre });
    }
    return { tableroId, yaEraMiembro };
  }
}
