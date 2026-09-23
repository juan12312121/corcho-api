import { BaseEntity } from '../shared/BaseEntity.js';
import { ReglaDeNegocioError, PermisoDenegadoError, EstadoInvalidoError } from '../shared/errors.js';
import { aCentavos } from '../shared/Dinero.js';
import { hoy as hoyDe } from '../shared/Fechas.js';

export const METODOS_PAGO = ['efectivo', 'transferencia', 'tarjeta', 'otro'];

/**
 * Un pago entre miembros de un tablero compartido ("Beto le pagó 100 a Ana").
 *  - Lo registra quien RECIBE → confirmado de una vez.
 *  - Lo registra quien PAGA   → pendiente hasta que quien recibe lo confirme.
 * Solo los confirmados cuentan en el balance.
 */
export class Pago extends BaseEntity {
  /**
   * @param {object} datos
   * @param {{ autorId: string, miembrosIds: string[], nota?: import('./Nota.js').Nota|null, ahora?: Date }} contexto
   */
  static registrar(datos, { tableroId, autorId, miembrosIds, nota = null, ahora = new Date() }) {
    const de = datos.deUsuarioId ?? autorId;
    const a = datos.aUsuarioId;
    if (de === a) throw new ReglaDeNegocioError('AUTOPAGO', 'Nadie se paga a sí mismo');
    if (autorId !== de && autorId !== a) throw new PermisoDenegadoError('Solo puedes registrar pagos donde tú pagas o recibes');
    if (![de, a].every((id) => miembrosIds.includes(id)))
      throw new ReglaDeNegocioError('NO_ES_MIEMBRO', 'Las dos personas deben ser miembros del tablero');
    const monto = Number(datos.monto);
    if (!(monto > 0) || aCentavos(monto) / 100 !== monto) throw new ReglaDeNegocioError('MONTO_INVALIDO', 'Monto mayor a cero con máximo 2 decimales');
    if (datos.notaId) Pago.#validarNota(nota, { tableroId, a });

    const confirmado = autorId === a;
    return new Pago({
      tableroId,
      deUsuarioId: de,
      aUsuarioId: a,
      monto,
      notaId: datos.notaId ?? null,
      concepto: datos.concepto ?? null,
      metodo: datos.metodo ?? 'efectivo',
      estado: confirmado ? 'confirmado' : 'pendiente',
      registradoPor: autorId,
      fecha: datos.fecha ?? hoyDe(ahora),
      confirmadoEn: confirmado ? ahora : null,
    });
  }

  static #validarNota(nota, { tableroId, a }) {
    if (!nota || nota.tableroId !== tableroId) throw new ReglaDeNegocioError('NOTA_INVALIDA', 'Esa nota no es de este tablero');
    if (!nota.afectaBalance()) throw new ReglaDeNegocioError('NOTA_SIN_DEUDA', 'Esa nota no genera deuda entre miembros');
    if (nota.pagadoPor !== a) throw new ReglaDeNegocioError('ABONO_A_OTRO', 'El abono a una nota va para quien la pagó');
  }

  cuentaEnBalance() {
    return this.estado === 'confirmado';
  }

  confirmar(actorId, ahora = new Date()) {
    this.#decidir(actorId, 'confirmado');
    this.confirmadoEn = ahora;
  }

  rechazar(actorId) {
    this.#decidir(actorId, 'rechazado');
  }

  #decidir(actorId, estado) {
    if (this.aUsuarioId !== actorId) throw new PermisoDenegadoError('Solo quien recibe el pago puede confirmarlo o rechazarlo');
    if (this.estado !== 'pendiente') throw new EstadoInvalidoError('PAGO_YA_DECIDIDO', `Ese pago ya está ${this.estado}`);
    this.estado = estado;
  }

  /** Pendiente/rechazado: lo quita quien lo registró. Confirmado: solo quien lo recibió puede anularlo. */
  exigirPuedeAnular(actorId) {
    if (this.cuentaEnBalance() && this.aUsuarioId !== actorId) throw new PermisoDenegadoError('Solo quien recibió el pago puede anularlo');
    if (!this.cuentaEnBalance() && this.registradoPor !== actorId) throw new PermisoDenegadoError('Solo quien lo registró puede quitarlo');
  }
}
