import { UseCase } from '../../shared/UseCase.js';

export class ListarMetas extends UseCase {
  constructor({ acceso, metas }) {
    super();
    this.acceso = acceso;
    this.metas = metas;
  }

  async ejecutar({ actor, tableroId }) {
    await this.acceso.exigir(tableroId, actor.id);
    return this.metas.listar(tableroId);
  }
}
