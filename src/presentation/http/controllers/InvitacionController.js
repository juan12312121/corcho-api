import { BaseController } from '../BaseController.js';
import * as esquemas from '../esquemas/invitaciones.js';

export class InvitacionController extends BaseController {
  // Lado del tablero (admins)
  listar = this.accion('listarInvitaciones');
  crear = this.accion('crearInvitacion', { body: esquemas.crear, status: 201 });
  cancelar = this.accion('cancelarInvitacion', { status: 204 });
  // Lado de la persona invitada
  pendientes = this.accion('listarMisInvitaciones');
  ver = this.accion('verInvitacion');
  aceptar = this.accion('aceptarInvitacion');
  rechazar = this.accion('rechazarInvitacion', { status: 204 });
}
