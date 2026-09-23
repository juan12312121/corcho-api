import { UseCase } from '../../shared/UseCase.js';

export class ListarIngresos extends UseCase {
  constructor({ acceso, ingresos }) {
    super();
    this.acceso = acceso;
    this.ingresos = ingresos;
  }

  async ejecutar({ actor, tableroId }) {
    await this.acceso.exigir(tableroId, actor.id);
    return this.ingresos.listar(tableroId);
  }
}
