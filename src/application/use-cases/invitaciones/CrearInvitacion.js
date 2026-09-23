import { UseCase } from '../../shared/UseCase.js';
import { ConflictoError } from '../../shared/errors.js';
import { Invitacion } from '../../../domain/entities/Invitacion.js';

/** Invitar por correo (personal) o crear un enlace para compartir. Solo admins de un tablero compartido. */
export class CrearInvitacion extends UseCase {
  constructor({ acceso, usuarios, miembros, invitaciones, codigos, eventos, bitacora, diasPorDefecto }) {
    super();
    this.acceso = acceso;
    this.usuarios = usuarios;
    this.miembros = miembros;
    this.invitaciones = invitaciones;
    this.codigos = codigos;
    this.eventos = eventos;
    this.bitacora = bitacora;
    this.diasPorDefecto = diasPorDefecto;
  }

  async ejecutar({ actor, tableroId, email, rol, usosMax, dias }) {
    const { tablero } = await this.acceso.exigir(tableroId, actor.id, 'admin');
    tablero.exigirCompartido();

    const invitado = email ? await this.usuarios.porEmail(email) : null;
    if (invitado && (await this.miembros.de(tableroId, invitado.id))) throw new ConflictoError('YA_ES_MIEMBRO', 'Esa persona ya está en el tablero');

    const invitacion = await this.invitaciones.crear(
      Invitacion.crear({ tableroId, invitadoPor: actor.id, email, rol, usosMax, dias: dias ?? this.diasPorDefecto, codigo: this.codigos.nuevo() }),
    );
    if (invitado) this.eventos.aUsuario(invitado.id, 'invitacion:nueva', { codigo: invitacion.codigo, tableroId, tablero: tablero.nombre });
    await this.bitacora.registrar(tableroId, actor.id, 'invitacion:creada', { email: invitacion.email });
    return invitacion;
  }
}
