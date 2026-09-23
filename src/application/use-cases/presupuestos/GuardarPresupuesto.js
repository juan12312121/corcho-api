import { UseCase } from '../../shared/UseCase.js';
import { Presupuesto } from '../../../domain/entities/Presupuesto.js';
import { exigirCategoria } from '../categorias/exigirCategoria.js';

/**
 * Pone (o cambia) el tope mensual de una categoría. En un tablero compartido
 * solo los admins; en uno personal, su dueño.
 */
export class GuardarPresupuesto extends UseCase {
  constructor({ acceso, categorias, presupuestos, eventos }) {
    super();
    this.acceso = acceso;
    this.categorias = categorias;
    this.presupuestos = presupuestos;
    this.eventos = eventos;
  }

  async ejecutar({ actor, tableroId, categoriaId, montoMensual }) {
    await this.acceso.exigir(tableroId, actor.id, 'admin');
    await exigirCategoria(this.categorias, categoriaId, tableroId);

    const existente = await this.presupuestos.porCategoria(categoriaId, tableroId);
    let guardado;
    if (existente) {
      existente.cambiarMonto(montoMensual);
      guardado = await this.presupuestos.guardar(existente);
    } else {
      guardado = await this.presupuestos.crear(Presupuesto.crear({ tableroId, categoriaId, montoMensual }));
    }
    this.eventos.aTablero(tableroId, 'balance:cambio', { tableroId });
    return guardado;
  }
}
