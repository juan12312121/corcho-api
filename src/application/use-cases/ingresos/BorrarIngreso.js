import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';

export class BorrarIngreso extends UseCase {
  constructor({ acceso, ingresos, eventos }) {
    super();
    this.acceso = acceso;
    this.ingresos = ingresos;
    this.eventos = eventos;
  }

  async ejecutar({ actor, tableroId, ingresoId }) {
    await this.acceso.exigir(tableroId, actor.id);
    if (!(await this.ingresos.porId(ingresoId, tableroId))) throw new NoEncontradoError('Ingreso no encontrado');
    await this.ingresos.borrar(ingresoId);
    this.eventos.aTablero(tableroId, 'balance:cambio', { tableroId });
  }
}
