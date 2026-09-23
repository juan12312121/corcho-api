import { BaseController } from '../BaseController.js';
import * as esquemas from '../esquemas/miembros.js';

export class MiembroController extends BaseController {
  listar = this.accion('listarMiembros');
  editar = this.accion('actualizarMiembro', { body: esquemas.editar });
  sacar = this.accion('quitarMiembro', { status: 204 });
  salir = this.accion('quitarMiembro', { status: 204, extra: (req) => ({ usuarioId: req.actor.id }) });
  transferir = this.accion('transferirTablero');
}
