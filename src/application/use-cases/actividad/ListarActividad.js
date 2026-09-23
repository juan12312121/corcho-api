import { UseCase } from '../../shared/UseCase.js';

export class ListarActividad extends UseCase {
  constructor({ acceso, actividad }) {
    super();
    this.acceso = acceso;
    this.actividad = actividad;
  }

  async ejecutar({ actor, tableroId, pagina, porPagina, tipo }) {
    await this.acceso.exigir(tableroId, actor.id);
    return this.actividad.listar(tableroId, { pagina, porPagina, tipo });
  }
}
