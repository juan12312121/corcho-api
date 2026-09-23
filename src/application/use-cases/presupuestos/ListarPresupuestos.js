import { UseCase } from '../../shared/UseCase.js';
import { resumenPresupuestos } from '../../../domain/services/ResumenPresupuestos.js';

/** Presupuestos del tablero con su avance en el mes actual. */
export class ListarPresupuestos extends UseCase {
  constructor({ acceso, presupuestos, notas }) {
    super();
    this.acceso = acceso;
    this.presupuestos = presupuestos;
    this.notas = notas;
  }

  async ejecutar({ actor, tableroId }) {
    await this.acceso.exigir(tableroId, actor.id);
    const [presupuestos, notas] = await Promise.all([
      this.presupuestos.listar(tableroId),
      this.notas.listar(tableroId, { filtros: {}, orden: 'fecha', limite: 2000 }),
    ]);
    return resumenPresupuestos(presupuestos, notas);
  }
}
