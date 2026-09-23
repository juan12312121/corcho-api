export { carpetaDeTablero } from '../../../domain/entities/Adjunto.js';

/** Carpeta de Cloudinary para la foto de perfil de cada usuario. */
export const carpetaDeAvatar = (usuarioId) => `corcho/avatares/${usuarioId}`;

/**
 * public_id de una URL de Cloudinary (lo que va después de /upload/, sin versión ni extensión):
 * .../image/upload/v169/corcho/avatares/u1/abc.jpg → corcho/avatares/u1/abc
 */
export function publicIdDeUrl(url) {
  const ruta = /\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i.exec(url ?? '');
  return ruta ? ruta[1] : null;
}
