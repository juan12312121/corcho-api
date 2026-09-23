import { BaseEntity } from '../shared/BaseEntity.js';
import { ReglaDeNegocioError } from '../shared/errors.js';
import { aCentavos } from '../shared/Dinero.js';

/** Tope de gasto al mes para una categoría ("Súper: $4,000"). */
export class Presupuesto extends BaseEntity {
  static crear({ tableroId, categoriaId, montoMensual }) {
    const p = new Presupuesto({ tableroId, categoriaId });
    p.cambiarMonto(montoMensual);
    return p;
  }

  cambiarMonto(montoMensual) {
    const n = Number(montoMensual);
    if (!(n > 0) || aCentavos(n) / 100 !== n) throw new ReglaDeNegocioError('MONTO_INVALIDO', 'El presupuesto es un monto mayor a cero con máximo 2 decimales');
    this.montoMensual = n;
  }
}
