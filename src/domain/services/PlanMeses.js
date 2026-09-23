import { ReglaDeNegocioError } from '../shared/errors.js';
import { aCentavos, aPesos, repartirProporcional } from '../shared/Dinero.js';
import { siguienteFecha } from './Recurrencia.js';

export const PLAZO_MINIMO = 2;
export const PLAZO_MAXIMO = 60;

export function validarPlazo(meses) {
  if (!Number.isInteger(meses) || meses < PLAZO_MINIMO || meses > PLAZO_MAXIMO)
    throw new ReglaDeNegocioError('PLAZO_INVALIDO', `El plazo va de ${PLAZO_MINIMO} a ${PLAZO_MAXIMO} meses`);
  return meses;
}

/**
 * Mensualidades de un total a N meses, en pesos. Los centavos que sobran van en las
 * primeras: $1,000 a 3 meses → 333.34, 333.33, 333.33 (siempre suman el total).
 */
export function mensualidades(total, meses) {
  validarPlazo(meses);
  return repartirProporcional(aCentavos(total), Array(meses).fill(1)).map(aPesos);
}

/** La mensualidad número `k` (1..meses). */
export function mensualidad(total, meses, k) {
  return mensualidades(total, meses)[k - 1];
}

/** Fecha de la mensualidad `k` contando desde la primera (mes a mes, respetando fin de mes). */
export function fechaDeMensualidad(primera, k) {
  let fecha = primera;
  for (let i = 1; i < k; i++) fecha = siguienteFecha(fecha, 'mensual');
  return fecha;
}

/** Cuántas mensualidades completas cubre lo pagado (para deudas a meses). */
export function mensualidadesCubiertas(total, meses, pagado) {
  let resto = aCentavos(pagado);
  let cubiertas = 0;
  for (const m of mensualidades(total, meses)) {
    if (resto < aCentavos(m)) break;
    resto -= aCentavos(m);
    cubiertas++;
  }
  return cubiertas;
}
