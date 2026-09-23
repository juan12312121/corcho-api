import { sumar } from '../shared/Dinero.js';
import { fechaDeMensualidad, mensualidad, mensualidadesCubiertas } from './PlanMeses.js';

/**
 * Lo que va "a meses" en un tablero:
 *  - compras a meses (varias notas con el mismo planId, una por mensualidad)
 *  - deudas a meses (una nota préstamo con plazoMeses, que se va pagando)
 *
 * @param {import('../entities/Nota.js').Nota[]} notas
 * @returns {Array<{ tipo: 'compra'|'deuda', planId: string, notaId: string, titulo: string, total: number,
 *   mensualidad: number, meses: number, pagadas: number, pagado: number, restante: number,
 *   proximaFecha: string|null, liquidado: boolean, contraparte: string|null, direccion: string|null }>}
 */
export function resumenPlanes(notas) {
  return [...comprasAMeses(notas), ...deudasAMeses(notas)].sort(
    (a, b) => Number(a.liquidado) - Number(b.liquidado) || (a.proximaFecha ?? '9999').localeCompare(b.proximaFecha ?? '9999'),
  );
}

function comprasAMeses(notas) {
  const planes = new Map();
  for (const n of notas.filter((x) => x.esCuotaDePlan())) planes.set(n.planId, [...(planes.get(n.planId) ?? []), n]);

  return [...planes.values()].map((cuotas) => {
    const ordenadas = cuotas.sort((a, b) => a.numeroCuota - b.numeroCuota);
    const ultima = ordenadas.at(-1);
    const pagadasNotas = ordenadas.filter((n) => !n.estaPorPagar());
    const pendiente = ordenadas.find((n) => n.estaPorPagar());
    const pagado = sumar(...pagadasNotas.map((n) => n.monto));
    return {
      tipo: 'compra',
      planId: ultima.planId,
      notaId: (pendiente ?? ultima).id,
      titulo: ultima.titulo,
      total: ultima.montoPlan,
      mensualidad: mensualidad(ultima.montoPlan, ultima.plazoMeses, (pendiente ?? ultima).numeroCuota),
      meses: ultima.plazoMeses,
      pagadas: pagadasNotas.length,
      pagado,
      restante: sumar(ultima.montoPlan, -pagado),
      proximaFecha: pendiente ? (pendiente.venceEn ?? pendiente.fecha) : null,
      liquidado: !pendiente && pagadasNotas.length === ultima.plazoMeses,
      contraparte: null,
      direccion: null,
    };
  });
}

function deudasAMeses(notas) {
  return notas
    .filter((n) => n.esDeudaAMeses())
    .map((n) => {
      const pagadas = mensualidadesCubiertas(n.monto, n.plazoMeses, n.abonado);
      const liquidado = pagadas >= n.plazoMeses || n.estado === 'liquidada';
      const inicio = n.venceEn ?? n.fecha;
      return {
        tipo: 'deuda',
        planId: n.id,
        notaId: n.id,
        titulo: n.titulo,
        total: n.monto,
        mensualidad: mensualidad(n.monto, n.plazoMeses, Math.min(pagadas + 1, n.plazoMeses)),
        meses: n.plazoMeses,
        pagadas: Math.min(pagadas, n.plazoMeses),
        pagado: n.abonado,
        restante: n.restante(),
        proximaFecha: liquidado ? null : fechaDeMensualidad(inicio, pagadas + 1),
        liquidado,
        contraparte: n.contraparte,
        direccion: n.direccion,
      };
    });
}
