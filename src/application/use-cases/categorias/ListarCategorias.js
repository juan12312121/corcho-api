import { UseCase } from '../../shared/UseCase.js';

export class ListarCategorias extends UseCase {
  constructor({ acceso, categorias }) {
    super();
    this.acceso = acceso;
    this.categorias = categorias;
  }

  async ejecutar({ actor, tableroId }) {
    await this.acceso.exigir(tableroId, actor.id);
    return this.categorias.listar(tableroId);
  }
}
