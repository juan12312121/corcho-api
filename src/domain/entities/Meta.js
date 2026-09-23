import { BaseEntity } from '../shared/BaseEntity.js';
import { ReglaDeNegocioError, PermisoDenegadoError } from '../shared/errors.js';
import { aCentavos, sumar } from '../shared/Dinero.js';

const regla = (codigo, mensaje) => new ReglaDeNegocioError(codigo, mensaje);
const COLOR = /^#[0-9A-Fa-f]{6}$/;

/**
 * Meta de ahorro ("Vacaciones: $15,000"). `ahorrado` es la suma de sus aportes;
 * un aporte negativo es un retiro y nunca la deja abajo de cero.
 */
export class Meta extends BaseEntity {
  static crear({ nombre, objetivo, fechaLimite = null, color = '#2E9E5B' }, { tableroId, autorId }) {
    const meta = new Meta({ tableroId, creadoPor: autorId, ahorrado: 0 });
    meta.editar({ nombre, objetivo, fechaLimite, color });
    return meta;
  }

  editar({ nombre, objetivo, fechaLimite, color }) {
    if (nombre !== undefined) {
      const limpio = String(nombre ?? '').trim();
      if (!limpio || limpio.length > 60) throw regla('NOMBRE_INVALIDO', 'El nombre de la meta debe tener de 1 a 60 caracteres');
      this.nombre = limpio;
    }
    if (objetivo !== undefined) this.objetivo = Meta.#montoValido(objetivo);
    if (fechaLimite !== undefined) this.fechaLimite = fechaLimite;
    if (color !== undefined) {
      if (!COLOR.test(color)) throw regla('COLOR_INVALIDO', 'El color va como #RRGGBB');
      this.color = color;
    }
  }

  /** Valida un aporte (o retiro, si es negativo) y devuelve el nuevo total ahorrado. */
  aportar(monto) {
    const n = Number(monto);
    if (!Number.isFinite(n) || n === 0 || aCentavos(n) / 100 !== n) throw regla('MONTO_INVALIDO', 'El aporte es un monto distinto de cero con máximo 2 decimales');
    const nuevo = sumar(this.ahorrado ?? 0, n);
    if (nuevo < 0) throw regla('RETIRO_EXCEDE', `Solo hay ${this.ahorrado} ahorrados en esta meta`);
    this.ahorrado = nuevo;
    return n;
  }

  exigirPuedeBorrar(miembro) {
    if (this.creadoPor !== miembro.usuarioId && !miembro.tieneRango('admin')) throw new PermisoDenegadoError('Solo quien creó la meta o un admin la puede borrar');
  }

  static #montoValido(monto) {
    const n = Number(monto);
    if (!(n > 0) || aCentavos(n) / 100 !== n) throw regla('MONTO_INVALIDO', 'El objetivo es un monto mayor a cero con máximo 2 decimales');
    return n;
  }
}
