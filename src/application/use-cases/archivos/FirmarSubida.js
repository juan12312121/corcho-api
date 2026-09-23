import { UseCase } from '../../shared/UseCase.js';
import { ApplicationError } from '../../shared/errors.js';
import { carpetaDeAvatar, carpetaDeTablero } from './carpetas.js';

export class AlmacenNoConfiguradoError extends ApplicationError {
  constructor() {
    super('FOTOS_NO_CONFIGURADAS', 'Las fotos no están configuradas en el servidor (faltan las llaves de Cloudinary)');
  }
}

/**
 * Da la firma para que el navegador suba la foto DIRECTO a Cloudinary.
 *  - con tableroId: foto de ticket (solo miembros), carpeta del tablero
 *  - sin tableroId: mi foto de perfil, mi carpeta
 */
export class FirmarSubida extends UseCase {
  constructor({ acceso, almacen }) {
    super();
    this.acceso = acceso;
    this.almacen = almacen;
  }

  async ejecutar({ actor, tableroId }) {
    if (!this.almacen.estaConfigurado()) throw new AlmacenNoConfiguradoError();
    if (!tableroId) return this.almacen.firmarSubida(carpetaDeAvatar(actor.id));
    await this.acceso.exigir(tableroId, actor.id);
    return this.almacen.firmarSubida(carpetaDeTablero(tableroId));
  }
}
