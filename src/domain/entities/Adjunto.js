import { BaseEntity } from '../shared/BaseEntity.js';
import { ReglaDeNegocioError, PermisoDenegadoError } from '../shared/errors.js';

export const MAXIMO_ADJUNTOS_POR_NOTA = 6;

/** Carpeta de Cloudinary donde van las fotos de un tablero. */
export const carpetaDeTablero = (tableroId) => `corcho/tableros/${tableroId}`;

/** Foto de un ticket o recibo pegada a una nota. El archivo vive en Cloudinary. */
export class Adjunto extends BaseEntity {
  static registrar({ tableroId, notaId, subidoPor, publicId, url, ancho = null, alto = null, formato = null, bytes = null }, { cuantosTiene }) {
    // Solo se aceptan archivos subidos a la carpeta de ESTE tablero (con la firma que dio el servidor)
    if (!String(publicId).startsWith(`${carpetaDeTablero(tableroId)}/`))
      throw new ReglaDeNegocioError('ADJUNTO_AJENO', 'Ese archivo no se subió para este tablero');
    if (!/^https:\/\/res\.cloudinary\.com\//.test(url)) throw new ReglaDeNegocioError('URL_INVALIDA', 'La foto debe venir de Cloudinary');
    if (cuantosTiene >= MAXIMO_ADJUNTOS_POR_NOTA)
      throw new ReglaDeNegocioError('DEMASIADOS_ADJUNTOS', `Una nota admite hasta ${MAXIMO_ADJUNTOS_POR_NOTA} fotos`);
    return new Adjunto({ tableroId, notaId, subidoPor, publicId, url, ancho, alto, formato, bytes });
  }

  /** Quien la subió o un admin la puede quitar. */
  exigirPuedeBorrar(miembro) {
    if (this.subidoPor !== miembro.usuarioId && !miembro.tieneRango('admin'))
      throw new PermisoDenegadoError('Solo quien subió la foto o un admin puede quitarla');
  }
}
