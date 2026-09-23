import { UseCase } from '../../shared/UseCase.js';

/** Para Socket.IO: ¿puede este usuario escuchar el tablero en vivo? */
export class VerificarAccesoEnVivo extends UseCase {
  constructor({ acceso }) {
    super();
    this.acceso = acceso;
  }

  async ejecutar({ actor, tableroId }) {
    return this.acceso.esMiembro(tableroId, actor.id);
  }
}
