import { hoy as hoyDe, sumarDias } from '../shared/Fechas.js';
import { resumenPlanes } from './ResumenPlanes.js';

const pesos = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

/** "hoy", "mañana" o "en 3 días". */
function cuando(dias) {
  if (dias === 0) return 'hoy';
  if (dias === 1) return 'mañana';
  return `en ${dias} días`;
}

/**
 * Qué avisar y a quién para una fecha: recibos por pagar que vencen y mensualidades
 * de deudas a meses. Solo a personas que activaron avisos y tienen celular.
 *
 * @param {Array<{ tablero: {id, nombre}, notas: Nota[], miembros: Array<{usuarioId, nombre, telefono, avisosWhatsapp}> }>} tableros
 * @param {{ diasAntes?: number, ahora?: Date }} opciones
 * @returns {Array<{ usuarioId, nombre, telefono, tableroId, tablero, notaId, motivo, monto, mensaje }>}
 */
export function recordatoriosDelDia(tableros, { diasAntes = 1, ahora = new Date() } = {}) {
  const objetivo = sumarDias(hoyDe(ahora), diasAntes);
  const avisos = [];

  for (const { tablero, notas, miembros } of tableros) {
    const avisables = new Map(miembros.filter((m) => m.avisosWhatsapp && m.telefono).map((m) => [m.usuarioId, m]));
    if (!avisables.size) continue;
    const agregar = (m, nota, motivo, monto, mensaje) =>
      avisos.push({ usuarioId: m.usuarioId, nombre: m.nombre, telefono: m.telefono, tableroId: tablero.id, tablero: tablero.nombre, notaId: nota.id, motivo, monto, mensaje });

    // 1) Recibos por pagar que vencen en la fecha objetivo: a cada participante, con lo que le toca
    for (const nota of notas.filter((n) => n.estaPorPagar() && !n.esRecordatorio() && n.venceEn === objetivo)) {
      const cuota = nota.numeroCuota ? ` (mensualidad ${nota.numeroCuota} de ${nota.plazoMeses})` : '';
      for (const parte of nota.partes) {
        const m = avisables.get(parte.usuarioId);
        if (!m) continue;
        const tuParte = nota.partes.length > 1 ? `; te tocan ${pesos(parte.monto)}` : '';
        agregar(m, nota, 'vencimiento', parte.monto,
          `📌 *${tablero.nombre}*: ${cuando(diasAntes)} vence "${nota.titulo}"${cuota} por ${pesos(nota.monto)}${tuParte}.`);
      }
    }

    // 2) Mensualidades de deudas a meses: al que debe (entre miembros) o al dueño (deuda con alguien de fuera)
    const deudas = new Map(notas.filter((n) => n.esDeudaAMeses()).map((n) => [n.id, n]));
    for (const plan of resumenPlanes([...deudas.values()]).filter((p) => p.tipo === 'deuda' && !p.liquidado && p.proximaFecha === objetivo)) {
      const nota = deudas.get(plan.notaId);
      const numero = `${plan.pagadas + 1} de ${plan.meses}`;
      if (nota.esDeudaExterna()) {
        const m = avisables.get(nota.creadoPor);
        if (!m) continue;
        const texto = nota.direccion === 'debo' ? `le toca tu pago a ${nota.contraparte}` : `${nota.contraparte} te debe pagar`;
        agregar(m, nota, 'mensualidad', plan.mensualidad,
          `📅 *${tablero.nombre}*: ${cuando(diasAntes)} ${texto}: mensualidad ${numero} de ${pesos(plan.mensualidad)} ("${nota.titulo}").`);
      } else {
        const acreedor = miembros.find((m) => m.usuarioId === nota.pagadoPor)?.nombre ?? 'quien te prestó';
        for (const parte of nota.partes.filter((p) => !p.liquidada && p.usuarioId !== nota.pagadoPor)) {
          const m = avisables.get(parte.usuarioId);
          if (!m) continue;
          agregar(m, nota, 'mensualidad', plan.mensualidad,
            `📅 *${tablero.nombre}*: ${cuando(diasAntes)} toca la mensualidad ${numero} de ${pesos(plan.mensualidad)} a ${acreedor} ("${nota.titulo}").`);
        }
      }
    }
  }
  return avisos;
}
