import { ReglaDeNegocioError } from '../shared/errors.js';
import { aCentavos, aPesos, repartirProporcional } from '../shared/Dinero.js';

export const MODOS_REPARTO = ['igual', 'montos', 'porcentaje', 'proporcion'];

const falla = (codigo, mensaje) => new ReglaDeNegocioError(codigo, mensaje);

/** Cómo se convierte cada participante en centavos según el modo. */
const ESTRATEGIAS = {
  igual: (total, participantes) => repartirProporcional(total, participantes.map(() => 1)),

  montos: (total, participantes) => {
    const centavos = participantes.map((p) => aCentavos(p.monto ?? NaN));
    if (centavos.some((c) => !Number.isFinite(c) || c < 0)) throw falla('MONTO_INVALIDO', 'Cada participante necesita un monto ≥ 0');
    const suma = centavos.reduce((a, b) => a + b, 0);
    if (suma !== total) throw falla('REPARTO_NO_CUADRA', `Los montos suman ${aPesos(suma)} y la nota es de ${aPesos(total)}`);
    return centavos;
  },

  porcentaje: (total, participantes) => {
    const pct = participantes.map((p) => Number(p.porcentaje));
    if (pct.some((x) => !Number.isFinite(x) || x < 0)) throw falla('PORCENTAJE_INVALIDO', 'Cada participante necesita un porcentaje ≥ 0');
    const suma = pct.reduce((a, b) => a + b, 0);
    if (Math.abs(suma - 100) > 0.01) throw falla('REPARTO_NO_CUADRA', `Los porcentajes suman ${suma} y deben sumar 100`);
    return repartirProporcional(total, pct);
  },

  proporcion: (total, participantes) => {
    const pesos = participantes.map((p) => Number(p.proporcion));
    if (pesos.some((x) => !Number.isFinite(x) || x < 0) || pesos.every((x) => x === 0))
      throw falla('PROPORCION_INVALIDA', 'Las proporciones deben ser ≥ 0 y al menos una mayor a 0');
    return repartirProporcional(total, pesos);
  },
};

/**
 * Calcula cuánto le toca a cada participante de una nota.
 * @param {number} total  pesos
 * @param {'igual'|'montos'|'porcentaje'|'proporcion'} modo
 * @param {Array<{usuarioId: string, monto?: number, porcentaje?: number, proporcion?: number}>} participantes
 * @returns {Array<{usuarioId: string, monto: number, porcentaje: number|null, proporcion: number|null}>}
 */
export function repartir(total, modo, participantes) {
  const estrategia = ESTRATEGIAS[modo];
  if (!estrategia) throw falla('MODO_INVALIDO', `Modo de reparto desconocido: ${modo}`);
  if (!participantes?.length) throw falla('SIN_PARTICIPANTES', 'La nota necesita al menos un participante');
  const ids = participantes.map((p) => p.usuarioId);
  if (new Set(ids).size !== ids.length) throw falla('PARTICIPANTE_REPETIDO', 'Un participante aparece dos veces');
  const centavosTotal = aCentavos(total);
  if (!(centavosTotal > 0)) throw falla('MONTO_INVALIDO', 'El monto debe ser mayor a cero');

  const centavos = estrategia(centavosTotal, participantes);
  return participantes.map((p, i) => ({
    usuarioId: p.usuarioId,
    monto: aPesos(centavos[i]),
    porcentaje: modo === 'porcentaje' ? Number(p.porcentaje) : null,
    proporcion: modo === 'proporcion' ? Number(p.proporcion) : null,
  }));
}
