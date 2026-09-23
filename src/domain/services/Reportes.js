import { sumar } from '../shared/Dinero.js';
import { hoy as hoyDe, mesDe } from '../shared/Fechas.js';

/** Los últimos N meses como 'AAAA-MM', del más viejo al actual. */
export function ultimosMeses(n, ahora = new Date()) {
  const [a, m] = mesDe(hoyDe(ahora)).split('-').map(Number);
  return Array.from({ length: n }, (_, i) => {
    const fecha = new Date(Date.UTC(a, m - 1 - (n - 1 - i), 1));
    return fecha.toISOString().slice(0, 7);
  });
}

const esGasto = (n) => !n.esRecordatorio() && !n.esDeudaExterna() && !n.estaPorPagar();

/**
 * Reporte de gasto: por mes, por categoría y por persona (lo que le tocó a cada quien).
 * @param {import('../entities/Nota.js').Nota[]} notas
 * @param {{ meses?: number, ahora?: Date }} opciones
 */
export function reporteDeGastos(notas, { meses = 6, ahora = new Date() } = {}) {
  const periodo = ultimosMeses(meses, ahora);
  const enPeriodo = notas.filter((n) => esGasto(n) && periodo.includes(mesDe(n.fecha)));

  const porMes = periodo.map((mes) => {
    const delMes = enPeriodo.filter((n) => mesDe(n.fecha) === mes);
    const categorias = {};
    for (const n of delMes) {
      const c = n.categoriaId ?? 'sin';
      categorias[c] = sumar(categorias[c], n.monto);
    }
    return { mes, total: sumar(...delMes.map((n) => n.monto)), cantidad: delMes.length, categorias };
  });

  const categorias = new Map();
  const personas = new Map();
  for (const n of enPeriodo) {
    const c = n.categoriaId ?? 'sin';
    categorias.set(c, sumar(categorias.get(c), n.monto));
    for (const p of n.partes) personas.set(p.usuarioId, sumar(personas.get(p.usuarioId), p.monto));
  }

  const total = sumar(...enPeriodo.map((n) => n.monto));
  return {
    periodo: { desde: periodo[0], hasta: periodo.at(-1), meses },
    total,
    promedioMensual: Math.round((total / meses) * 100) / 100,
    porMes,
    porCategoria: [...categorias].map(([categoriaId, monto]) => ({ categoriaId: categoriaId === 'sin' ? null : categoriaId, total: monto })).sort((a, b) => b.total - a.total),
    porPersona: [...personas].map(([usuarioId, monto]) => ({ usuarioId, total: monto })).sort((a, b) => b.total - a.total),
    // Detalle plano para exportar a Excel
    detalle: enPeriodo
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map((n) => ({ fecha: n.fecha, titulo: n.titulo, tipo: n.tipo, categoriaId: n.categoriaId, monto: n.monto, pagadoPor: n.pagadoPor })),
  };
}
