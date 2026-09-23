/** Fechas de calendario como texto 'AAAA-MM-DD' (sin horas ni zonas). */

export const hoy = (ahora = new Date()) => ahora.toISOString().slice(0, 10);

export function sumarDias(fecha, dias) {
  const [a, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

export const mesDe = (fecha) => fecha.slice(0, 7);
