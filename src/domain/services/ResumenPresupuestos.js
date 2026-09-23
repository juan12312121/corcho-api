import { sumar } from '../shared/Dinero.js';
import { hoy as hoyDe, mesDe } from '../shared/Fechas.js';

/** Umbrales de aviso: al 80 % "cerca", al 100 % "excedido". */
export const UMBRAL_CERCA = 0.8;

/** Lo que cuenta como gasto del mes: pagado, con dinero y sin ser deuda con alguien de fuera. */
export function esGastoDelMes(nota, mes) {
  return !nota.esRecordatorio() && !nota.esDeudaExterna() && !nota.estaPorPagar() && mesDe(nota.fecha) === mes;
}

/**
 * Avance de cada presupuesto en el mes actual.
 * @param {import('../entities/Presupuesto.js').Presupuesto[]} presupuestos
 * @param {import('../entities/Nota.js').Nota[]} notas
 * @returns {Array<{ presupuestoId, categoriaId, limite, gastado, restante, porcentaje, estado: 'ok'|'cerca'|'excedido' }>}
 */
export function resumenPresupuestos(presupuestos, notas, ahora = new Date()) {
  const mes = mesDe(hoyDe(ahora));
  const gastoPorCategoria = new Map();
  for (const n of notas.filter((x) => x.categoriaId && esGastoDelMes(x, mes))) {
    gastoPorCategoria.set(n.categoriaId, sumar(gastoPorCategoria.get(n.categoriaId), n.monto));
  }
  return presupuestos.map((p) => {
    const gastado = gastoPorCategoria.get(p.categoriaId) ?? 0;
    const proporcion = gastado / p.montoMensual;
    return {
      presupuestoId: p.id,
      categoriaId: p.categoriaId,
      limite: p.montoMensual,
      gastado,
      restante: sumar(p.montoMensual, -gastado),
      porcentaje: Math.round(proporcion * 100),
      estado: proporcion >= 1 ? 'excedido' : proporcion >= UMBRAL_CERCA ? 'cerca' : 'ok',
    };
  });
}
