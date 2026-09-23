import { UseCase } from '../../shared/UseCase.js';

export class ListarMiembros extends UseCase {
  constructor({ acceso, miembros }) {
    super();
    this.acceso = acceso;
    this.miembros = miembros;
  }

  async ejecutar({ actor, tableroId }) {
    await this.acceso.exigir(tableroId, actor.id);
    return this.miembros.listarConUsuarios(tableroId);
  }
}
