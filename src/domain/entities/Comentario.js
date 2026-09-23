import { BaseEntity } from '../shared/BaseEntity.js';
import { ReglaDeNegocioError, PermisoDenegadoError } from '../shared/errors.js';

/** Comentario en una nota ("ya lo transferí", "¿de qué fue esto?"), con @menciones a miembros. */
export class Comentario extends BaseEntity {
  static escribir({ tableroId, notaId, usuarioId, texto, menciones = [] }, { miembrosIds }) {
    const limpio = String(texto ?? '').trim();
    if (!limpio || limpio.length > 1000) throw new ReglaDeNegocioError('TEXTO_INVALIDO', 'El comentario va de 1 a 1000 caracteres');
    // Solo se puede mencionar a miembros del tablero; a uno mismo no tiene caso avisarle
    const unicas = [...new Set(menciones)].filter((id) => id !== usuarioId);
    const ajenas = unicas.filter((id) => !miembrosIds.includes(id));
    if (ajenas.length) throw new ReglaDeNegocioError('MENCION_INVALIDA', 'Solo puedes mencionar a miembros del tablero');
    return new Comentario({ tableroId, notaId, usuarioId, texto: limpio, menciones: unicas });
  }

  exigirPuedeBorrar(miembro) {
    if (this.usuarioId !== miembro.usuarioId && !miembro.tieneRango('admin'))
      throw new PermisoDenegadoError('Solo quien escribió el comentario o un admin puede borrarlo');
  }
}
