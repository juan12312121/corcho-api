import { sumarDias } from '../shared/Fechas.js';

export const RECURRENCIAS = ['ninguna', 'semanal', 'quincenal', 'mensual'];

const avanzar = {
  ninguna: (fecha) => fecha,
  semanal: (fecha) => sumarDias(fecha, 7),
  quincenal: (fecha) => sumarDias(fecha, 14),
  /** Respeta fin de mes: 31 ene → 28/29 feb. */
  mensual: (fecha) => {
    const [a, m, d] = fecha.split('-').map(Number);
    const ultimoDelMes = new Date(Date.UTC(a, m + 1, 0)).getUTCDate();
    return new Date(Date.UTC(a, m, Math.min(d, ultimoDelMes))).toISOString().slice(0, 10);
  },
};

/** Siguiente fecha de un cargo recurrente ('AAAA-MM-DD'). */
export function siguienteFecha(fecha, recurrencia) {
  if (!fecha) return null;
  return avanzar[recurrencia](fecha);
}
