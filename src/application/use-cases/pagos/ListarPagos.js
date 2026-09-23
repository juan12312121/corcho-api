import { UseCase } from '../../shared/UseCase.js';

export class ListarPagos extends UseCase {
  constructor({ acceso, pagos }) {
    super();
    this.acceso = acceso;
    this.pagos = pagos;
  }

  async ejecutar({ actor, tableroId, pagina, porPagina, ...filtros }) {
    await this.acceso.exigir(tableroId, actor.id);
    return this.pagos.listar(tableroId, { filtros, pagina, porPagina });
  }
}
