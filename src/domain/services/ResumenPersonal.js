import { sumar } from '../shared/Dinero.js';
import { hoy as hoyDe, sumarDias, mesDe } from '../shared/Fechas.js';

const DIAS_PROXIMOS = 7;
const SIN_CATEGORIA = '-';

/**
 * Resumen de un tablero personal: en qué se fue el dinero del mes,
 * qué recibos faltan, cuáles vencieron y cuánto debo / me deben a gente de fuera.
 *
 * @param {import('../entities/Nota.js').Nota[]} notas
 * @param {Date} [ahora]
 * @param {import('../entities/Ingreso.js').Ingreso[]} [ingresos]  lo que entra (sueldo, ventas…)
 */
export function resumenPersonal(notas, ahora = new Date(), ingresos = []) {
  const hoy = hoyDe(ahora);
  const mes = mesDe(hoy);
  const conDinero = notas.filter((n) => !n.esRecordatorio() && !n.esDeudaExterna());

  const delMes = conDinero.filter((n) => n.estado !== 'por_pagar' && mesDe(n.fecha) === mes);
  const categorias = new Map();
  for (const n of delMes) {
    const c = n.categoriaId ?? SIN_CATEGORIA;
    categorias.set(c, sumar(categorias.get(c), n.monto));
  }

  const porPagar = conDinero.filter((n) => n.estado === 'por_pagar');
  const vencidas = porPagar.filter((n) => n.venceEn && n.venceEn < hoy);
  const proximas = porPagar.filter((n) => n.venceEn && n.venceEn >= hoy && n.venceEn <= sumarDias(hoy, DIAS_PROXIMOS));

  const externas = notas.filter((n) => n.esDeudaExterna() && n.estado !== 'liquidada');
  const pendiente = (direccion) => sumar(...externas.filter((n) => n.direccion === direccion).map((n) => n.restante()));

  const total = (lista) => ({ total: sumar(...lista.map((n) => n.monto)), cantidad: lista.length });
  const gastadoMes = sumar(...delMes.map((n) => n.monto));
  const ingresosMes = sumar(...ingresos.filter((i) => i.cuentaEnMes(mes)).map((i) => i.monto));
  return {
    tipo: 'personal',
    mes,
    gastadoMes,
    // Flujo del mes: entró − salió
    ingresosMes,
    disponible: sumar(ingresosMes, -gastadoMes),
    porCategoria: [...categorias].map(([categoriaId, total]) => ({ categoriaId: categoriaId === SIN_CATEGORIA ? null : categoriaId, total })).sort((a, b) => b.total - a.total),
    porPagar: total(porPagar),
    vencidas: total(vencidas),
    proximas: { ...total(proximas), dias: DIAS_PROXIMOS },
    debo: pendiente('debo'),
    meDeben: pendiente('me_deben'),
  };
}
