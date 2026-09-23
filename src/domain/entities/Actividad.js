import { BaseEntity } from '../shared/BaseEntity.js';

/** Una línea de la bitácora del tablero ("Ana agregó Súper del sábado"). */
export class Actividad extends BaseEntity {
  static registrar(tableroId, usuarioId, tipo, datos = {}) {
    return new Actividad({ tableroId, usuarioId, tipo, datos });
  }
}
