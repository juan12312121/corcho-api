import { BaseEntity } from '../shared/BaseEntity.js';
import { ReglaDeNegocioError } from '../shared/errors.js';
import { aCentavos } from '../shared/Dinero.js';
import { hoy as hoyDe, mesDe } from '../shared/Fechas.js';

const regla = (codigo, mensaje) => new ReglaDeNegocioError(codigo, mensaje);

/**
 * Dinero que entra en un tablero personal ("sueldo", "venta"). Con `recurrente`
 * cuenta cada mes a partir de su fecha (el sueldo se captura una sola vez).
 */
export class Ingreso extends BaseEntity {
  static registrar({ concepto, monto, fecha, recurrente = false }, { tablero, autorId, ahora = new Date() }) {
    if (!tablero.esPersonal()) throw regla('SOLO_TABLERO_PERSONAL', 'Los ingresos se llevan en un tablero personal');
    const limpio = String(concepto ?? '').trim();
    if (!limpio || limpio.length > 80) throw regla('CONCEPTO_INVALIDO', 'El concepto debe tener de 1 a 80 caracteres');
    const n = Number(monto);
    if (!(n > 0) || aCentavos(n) / 100 !== n) throw regla('MONTO_INVALIDO', 'Monto mayor a cero con máximo 2 decimales');
    return new Ingreso({ tableroId: tablero.id, creadoPor: autorId, concepto: limpio, monto: n, fecha: fecha ?? hoyDe(ahora), recurrente: Boolean(recurrente) });
  }

  /** ¿Entra en el mes 'AAAA-MM'? */
  cuentaEnMes(mes) {
    return this.recurrente ? mesDe(this.fecha) <= mes : mesDe(this.fecha) === mes;
  }
}
