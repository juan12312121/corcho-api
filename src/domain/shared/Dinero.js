/** Todo el cálculo de dinero se hace en centavos enteros para no perder nada al redondear. */
export const aCentavos = (pesos) => Math.round(Number(pesos) * 100);
export const aPesos = (centavos) => Math.round(centavos) / 100;
export const sumar = (...montos) => aPesos(montos.reduce((t, m) => t + aCentavos(m ?? 0), 0));

/**
 * Reparte `total` centavos según `pesos` (números ≥ 0) con el método del mayor residuo:
 * la suma del resultado siempre es exactamente `total`.
 */
export function repartirProporcional(total, pesos) {
  const suma = pesos.reduce((a, b) => a + b, 0);
  const exactos = pesos.map((p) => (total * p) / suma);
  const base = exactos.map(Math.floor);
  let resto = total - base.reduce((a, b) => a + b, 0);
  const orden = exactos
    .map((x, i) => ({ i, fraccion: x - Math.floor(x) }))
    .sort((a, b) => b.fraccion - a.fraccion || a.i - b.i);
  for (let k = 0; resto > 0; k = (k + 1) % orden.length, resto--) base[orden[k].i]++;
  return base;
}
