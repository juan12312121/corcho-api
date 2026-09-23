import { UseCase } from '../../shared/UseCase.js';
import { NoAutenticadoError, NoEncontradoError } from '../../shared/errors.js';
import { ReglaDeNegocioError } from '../../../domain/shared/errors.js';
import { borrarArchivos } from '../archivos/BorrarAdjunto.js';
import { carpetaDeAvatar, publicIdDeUrl } from '../archivos/carpetas.js';

/** Mi perfil: nombre, color, foto, celular + avisos, datos para recibir pagos y contraseña. */
export class ActualizarPerfil extends UseCase {
  constructor({ usuarios, hasher, almacen }) {
    super();
    this.usuarios = usuarios;
    this.hasher = hasher;
    this.almacen = almacen;
  }

  async ejecutar({ actor, password, passwordActual, clabe, banco, titularCuenta, ...perfil }) {
    const usuario = await this.usuarios.porId(actor.id);
    if (!usuario) throw new NoEncontradoError('Tu cuenta ya no existe');
    if (perfil.avatarUrl) this.#exigirAvatarPropio(perfil.avatarUrl, actor.id);
    const fotoAnterior = perfil.avatarUrl !== undefined && perfil.avatarUrl !== usuario.avatarUrl ? usuario.avatarUrl : null;

    usuario.actualizarPerfil(perfil);
    usuario.cambiarDatosPago({ clabe, banco, titularCuenta });
    if (password) {
      if (!(await this.hasher.coincide(passwordActual ?? '', usuario.passwordHash)))
        throw new NoAutenticadoError('La contraseña actual no coincide');
      usuario.cambiarPassword(await this.hasher.cifrar(password));
    }
    const guardado = await this.usuarios.guardar(usuario);
    await this.#borrarFotoAnterior(fotoAnterior, actor.id);
    return guardado;
  }

  /** Al cambiar o quitar la foto, la vieja se borra de Cloudinary (solo si era de mi carpeta). */
  async #borrarFotoAnterior(url, usuarioId) {
    const publicId = publicIdDeUrl(url);
    if (publicId?.startsWith(`${carpetaDeAvatar(usuarioId)}/`) && this.almacen) await borrarArchivos(this.almacen, [{ publicId }]);
  }

  /** La foto debe estar en MI carpeta de Cloudinary (subida con la firma que dio el servidor). */
  #exigirAvatarPropio(url, usuarioId) {
    if (!url.startsWith('https://res.cloudinary.com/') || !url.includes(`/${carpetaDeAvatar(usuarioId)}/`))
      throw new ReglaDeNegocioError('AVATAR_INVALIDO', 'La foto de perfil debe subirse desde Corcho');
  }
}
