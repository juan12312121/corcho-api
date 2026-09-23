import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';

export class BorrarPresupuesto extends UseCase {
  constructor({ acceso, presupuestos, eventos }) {
    super();
    this.acceso = acceso;
    this.presupuestos = presupuestos;
    this.eventos = eventos;
  }

  async ejecutar({ actor, tableroId, presupuestoId }) {
    await this.acceso.exigir(tableroId, actor.id, 'admin');
    if (!(await this.presupuestos.porId(presupuestoId, tableroId))) throw new NoEncontradoError('Presupuesto no encontrado');
    await this.presupuestos.borrar(presupuestoId);
    this.eventos.aTablero(tableroId, 'balance:cambio', { tableroId });
  }
}
