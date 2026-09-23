import { aCentavos, aPesos } from '../shared/Dinero.js';

/** Tarifa de Stripe en México para tarjetas nacionales: 3.6 % + $3.00, más IVA. */
const PORCENTAJE = 0.036;
const FIJO = 3;
const IVA = 1.16;
export const MINIMO_CON_TARJETA = 10;

/**
 * Cuánto se le suma a quien paga para que quien cobra reciba EXACTO lo que le deben
 * (la deuda queda saldada al centavo). Se despeja T de: T − (T·3.6 % + $3)·IVA ≥ monto.
 * @returns {{ comision: number, total: number }}
 */
export function comisionTarjeta(monto) {
  const neto = aCentavos(monto);
  const total = Math.ceil((neto + FIJO * 100 * IVA) / (1 - PORCENTAJE * IVA));
  return { comision: aPesos(total - neto), total: aPesos(total) };
}
