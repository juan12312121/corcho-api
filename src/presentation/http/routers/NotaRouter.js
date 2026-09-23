import { BaseRouter } from '../BaseRouter.js';

/** /tableros/:tableroId/notas */
export class NotaRouter extends BaseRouter {
  rutas() {
    this.post('/fotos/firma', 'firmarFoto');
    this.post('/archivar-saldadas', 'archivarSaldadas');
    this.patch('/:notaId/posicion', 'mover');
    this.patch('/:notaId/archivo', 'archivar');
    this.post('/:notaId/adjuntos', 'agregarFoto');
    this.delete('/:notaId/adjuntos/:adjuntoId', 'quitarFoto');
    this.get('/:notaId/comentarios', 'comentarios');
    this.post('/:notaId/comentarios', 'comentar');
    this.delete('/:notaId/comentarios/:comentarioId', 'borrarComentario');
    this.post('/:notaId/pagar', 'pagar');
    this.post('/:notaId/abonos', 'abonar');
    this.crud(':notaId');
  }
}
