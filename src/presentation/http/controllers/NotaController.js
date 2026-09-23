import { BaseController } from '../BaseController.js';
import * as esquemas from '../esquemas/notas.js';

export class NotaController extends BaseController {
  listar = this.accion('listarNotas', { query: esquemas.filtros });
  crear = this.accion('crearNota', { body: esquemas.crear, status: 201 });
  obtener = this.accion('obtenerNota');
  editar = this.accion('editarNota', { body: esquemas.editar });
  borrar = this.accion('borrarNota', { status: 204 });
  /** El cliente manda X-Socket-Id para no recibir su propio eco en vivo. */
  mover = this.accion('moverNota', { body: esquemas.mover, extra: (req) => ({ conexionId: req.get('x-socket-id') }) });
  pagar = this.accion('pagarNota', { body: esquemas.pagar });
  abonar = this.accion('abonarNota', { body: esquemas.abonar });
  archivar = this.accion('archivarNota', { body: esquemas.archivar });
  archivarSaldadas = this.accion('archivarSaldadas');
  // Fotos de tickets (Cloudinary)
  firmarFoto = this.accion('firmarSubida');
  agregarFoto = this.accion('registrarAdjunto', { body: esquemas.adjunto, status: 201 });
  quitarFoto = this.accion('borrarAdjunto', { status: 204 });
  // Comentarios
  comentarios = this.accion('listarComentarios');
  comentar = this.accion('crearComentario', { body: esquemas.comentario, status: 201 });
  borrarComentario = this.accion('borrarComentario', { status: 204 });
}
