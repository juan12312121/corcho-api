import { UseCase } from '../../shared/UseCase.js';
import { Ingreso } from '../../../domain/entities/Ingreso.js';

/** Registrar dinero que entra (solo tablero personal); mueve el flujo del mes. */
export class CrearIngreso extends UseCase {
  constructor({ acceso, ingresos, eventos }) {
    super();
    this.acceso = acceso;
    this.ingresos = ingresos;
    this.eventos = eventos;
  }

  async ejecutar({ actor, tableroId, ...datos }) {
    const { tablero } = await this.acceso.exigir(tableroId, actor.id);
    const ingreso = await this.ingresos.crear(Ingreso.registrar(datos, { tablero, autorId: actor.id }));
    this.eventos.aTablero(tableroId, 'balance:cambio', { tableroId });
    return ingreso;
  }
}
