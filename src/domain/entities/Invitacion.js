import { BaseEntity } from '../shared/BaseEntity.js';
import { EstadoInvalidoError, NoVigenteError, PermisoDenegadoError } from '../shared/errors.js';

const DIA_MS = 864e5;

/**
 * Invitación a un tablero compartido.
 *  - Con email: personal, de un solo uso, solo la puede aceptar esa persona.
 *  - Sin email: enlace para compartir (WhatsApp), hasta `usosMax` personas.
 */
export class Invitacion extends BaseEntity {
  static crear({ tableroId, invitadoPor, email = null, rol = 'miembro', usosMax = null, dias, codigo, ahora = new Date() }) {
    return new Invitacion({
      tableroId,
      invitadoPor,
      email: email?.toLowerCase() ?? null,
      codigo,
      rol,
      estado: 'pendiente',
      usosMax: email ? 1 : usosMax,
      usos: 0,
      expiraEn: new Date(ahora.getTime() + dias * DIA_MS),
    });
  }

  estaVigente(ahora = new Date()) {
    return this.estado === 'pendiente' && new Date(this.expiraEn) > ahora;
  }

  esPara(email) {
    return !this.email || this.email === email.toLowerCase();
  }

  exigirAceptablePor(usuario, ahora = new Date()) {
    if (this.estado !== 'pendiente') throw new NoVigenteError('INVITACION_NO_VIGENTE', 'Esta invitación ya no está disponible');
    if (!this.estaVigente(ahora)) throw new NoVigenteError('INVITACION_VENCIDA', 'La invitación venció; pide otra');
    if (!this.esPara(usuario.email)) throw new PermisoDenegadoError('Esta invitación es para otro correo');
  }

  /** Cuenta un uso; al llegar al tope queda aceptada (ya nadie más la usa). */
  registrarUso() {
    this.usos += 1;
    if (this.usosMax !== null && this.usos >= this.usosMax) this.estado = 'aceptada';
  }

  cancelar() {
    if (this.estado !== 'pendiente') throw new EstadoInvalidoError('INVITACION_NO_PENDIENTE', 'Esa invitación ya no está pendiente');
    this.estado = 'cancelada';
  }

  rechazarPor(usuario) {
    if (this.estado !== 'pendiente') throw new EstadoInvalidoError('INVITACION_NO_PENDIENTE', 'Esa invitación ya no está pendiente');
    if (!this.email || !this.esPara(usuario.email)) throw new PermisoDenegadoError('Solo la persona invitada puede rechazarla');
    this.estado = 'rechazada';
  }
}
