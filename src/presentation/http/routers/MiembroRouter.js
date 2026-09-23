import { BaseRouter } from '../BaseRouter.js';

/** /tableros/:tableroId/miembros */
export class MiembroRouter extends BaseRouter {
  rutas() {
    this.post('/salir', 'salir');
    this.post('/:usuarioId/transferir', 'transferir');
    this.get('/', 'listar');
    this.patch('/:usuarioId', 'editar');
    this.delete('/:usuarioId', 'sacar');
  }
}
