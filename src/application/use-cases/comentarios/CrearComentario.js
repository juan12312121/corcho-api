import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';
import { Comentario } from '../../../domain/entities/Comentario.js';

/** Comentar una nota. A quien mencionen (@Ana) le llega un aviso personal en vivo. */
export class CrearComentario extends UseCase {
  constructor({ acceso, notas, miembros, comentarios, eventos }) {
    super();
    this.acceso = acceso;
    this.notas = notas;
    this.miembros = miembros;
    this.comentarios = comentarios;
    this.eventos = eventos;
  }

  async ejecutar({ actor, tableroId, notaId, texto, menciones }) {
    const { tablero } = await this.acceso.exigir(tableroId, actor.id);
    const nota = await this.notas.porId(notaId, tableroId);
    if (!nota) throw new NoEncontradoError('Nota no encontrada');

    const miembrosIds = await this.miembros.idsDe(tableroId);
    const guardado = await this.comentarios.crear(
      Comentario.escribir({ tableroId, notaId, usuarioId: actor.id, texto, menciones }, { miembrosIds }),
    );
    const completo = (await this.comentarios.deNota(notaId)).find((c) => c.id === guardado.id);

    this.eventos.aTablero(tableroId, 'comentario:nuevo', completo);
    for (const usuarioId of guardado.menciones) {
      this.eventos.aUsuario(usuarioId, 'mencion', {
        tableroId,
        tablero: tablero.nombre,
        notaId,
        nota: nota.titulo,
        autor: completo.autor,
        texto: guardado.texto,
      });
    }
    return completo;
  }
}
