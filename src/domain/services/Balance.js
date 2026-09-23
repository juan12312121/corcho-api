import { aCentavos, aPesos } from '../shared/Dinero.js';

/**
 * Una "deuda" es cualquier movimiento que deja a alguien debiéndole a otro:
 *   - la parte de una nota pagada:  deudor = participante, acreedor = quien pagó
 *   - un pago confirmado de X a Y:  deudor = Y, acreedor = X   (el pago "devuelve" deuda)
 * Con esa sola forma se calcula todo el balance de un tablero compartido.
 *
 * @typedef {{ deudor: string, acreedor: string, monto: number }} Deuda
 * @typedef {{ de: string, a: string, monto: number }} Transferencia
 */

function netosEnCentavos(deudas) {
  const neto = new Map();
  const sumar = (u, c) => neto.set(u, (neto.get(u) ?? 0) + c);
  for (const d of deudas) {
    if (d.deudor === d.acreedor) continue;
    const c = aCentavos(d.monto);
    sumar(d.acreedor, c);
    sumar(d.deudor, -c);
  }
  return neto;
}

/** @returns {Record<string, number>} usuario → pesos (positivo = le deben, negativo = debe) */
export function netos(deudas) {
  return Object.fromEntries([...netosEnCentavos(deudas)].map(([u, c]) => [u, aPesos(c)]));
}

/** Quién le debe a quién, par por par, sin simplificar. @returns {Transferencia[]} */
export function entrePares(deudas) {
  const porPar = new Map(); // "x|y" (x<y) → centavos que x le debe a y (negativo: y le debe a x)
  for (const d of deudas) {
    if (d.deudor === d.acreedor) continue;
    const [x, y] = [d.deudor, d.acreedor].sort();
    const signo = d.deudor === x ? 1 : -1;
    const clave = `${x}|${y}`;
    porPar.set(clave, (porPar.get(clave) ?? 0) + signo * aCentavos(d.monto));
  }
  const resultado = [];
  for (const [clave, c] of porPar) {
    if (c === 0) continue;
    const [x, y] = clave.split('|');
    resultado.push(c > 0 ? { de: x, a: y, monto: aPesos(c) } : { de: y, a: x, monto: aPesos(-c) });
  }
  return resultado.sort((p, q) => q.monto - p.monto);
}

/**
 * Lo que YO tengo que pagar para quedar a mano: las sugerencias donde pago yo,
 * menos lo que ya mandé y sigue pendiente de confirmar (para no pagar dos veces).
 * @param {Transferencia[]} sugerencias
 * @param {{ aUsuarioId: string, monto: number }[]} pendientes  mis pagos pendientes
 * @returns {Transferencia[]}
 */
export function misPagosParaQuedarAMano(sugerencias, yoId, pendientes = []) {
  return sugerencias
    .filter((s) => s.de === yoId)
    .map((s) => {
      const enCamino = pendientes.filter((p) => p.aUsuarioId === s.a).reduce((t, p) => t + aCentavos(p.monto), 0);
      return { ...s, monto: aPesos(aCentavos(s.monto) - enCamino) };
    })
    .filter((s) => s.monto > 0);
}

/**
 * Mínimo de transferencias para dejar a todos en cero (voraz: el que más debe
 * le paga al que más le deben). A lo sumo n-1 pagos. @returns {Transferencia[]}
 */
export function simplificar(deudas) {
  const neto = netosEnCentavos(deudas);
  const porMonto = (a, b) => b.c - a.c || a.u.localeCompare(b.u);
  const deudores = [...neto].filter(([, c]) => c < 0).map(([u, c]) => ({ u, c: -c })).sort(porMonto);
  const acreedores = [...neto].filter(([, c]) => c > 0).map(([u, c]) => ({ u, c })).sort(porMonto);

  const pagos = [];
  let i = 0;
  let j = 0;
  while (i < deudores.length && j < acreedores.length) {
    const m = Math.min(deudores[i].c, acreedores[j].c);
    pagos.push({ de: deudores[i].u, a: acreedores[j].u, monto: aPesos(m) });
    deudores[i].c -= m;
    acreedores[j].c -= m;
    if (deudores[i].c === 0) i++;
    if (acreedores[j].c === 0) j++;
  }
  return pagos;
}
