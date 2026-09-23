import { ReglaDeNegocioError } from '../shared/errors.js';
import { aCentavos, aPesos } from '../shared/Dinero.js';

const regla = (codigo, mensaje) => new ReglaDeNegocioError(codigo, mensaje);
const SIN_MONEDA = { monedaOriginal: null, montoOriginal: null, tipoCambio: null };

/**
 * Nota pagada en otra moneda ("US$50 a 18.20"): el monto del tablero se calcula aquí
 * (montoOriginal × tipoCambio, a centavos) y se guardan los datos originales.
 *  - sin `monedaOriginal` en los datos → no se toca nada
 *  - `monedaOriginal` null o igual a la del tablero → se quita la conversión
 */
export function conMonedaExtranjera(datos, monedaTablero) {
  if (datos.monedaOriginal === undefined) return datos;
  if (datos.monedaOriginal === null || datos.monedaOriginal === monedaTablero) return { ...datos, ...SIN_MONEDA };

  const moneda = String(datos.monedaOriginal).toUpperCase();
  if (!/^[A-Z]{3}$/.test(moneda)) throw regla('MONEDA_INVALIDA', 'La moneda va en código de 3 letras (USD, EUR…)');
  const original = Number(datos.montoOriginal);
  if (!(original > 0) || aCentavos(original) / 100 !== original) throw regla('MONTO_INVALIDO', 'El monto en la otra moneda es mayor a cero con máximo 2 decimales');
  const tipoCambio = Number(datos.tipoCambio);
  if (!(tipoCambio > 0) || !Number.isFinite(tipoCambio)) throw regla('TIPO_CAMBIO_INVALIDO', 'El tipo de cambio debe ser mayor a cero');

  const monto = aPesos(Math.round(original * tipoCambio * 100));
  if (!(monto > 0)) throw regla('MONTO_INVALIDO', 'Con ese tipo de cambio el monto queda en cero');
  return { ...datos, monedaOriginal: moneda, montoOriginal: original, tipoCambio, monto };
}
