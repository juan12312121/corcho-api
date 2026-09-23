import { Pago } from '../../../domain/entities/Pago.js';
import { efectoEnNota, resumenPago } from '../pagos/RegistrarPago.js';

/**
 * Registra (ya confirmado) el pago de una sesión de Checkout que la pasarela cobró.
 * Idempotente: el aviso de Stripe y la verificación al regresar pueden llegar los dos.
 * @returns {Promise<{ pago: Pago|null, nuevo: boolean }>}
 */
export async function registrarCobro(sesionId, { pasarela, pagos, miembros, notas, liquidacion, avisos, bitacora }) {
  const previo = await pagos.porSesionStripe(sesionId);
  if (previo) return { pago: previo, nuevo: false };

  const cobro = await pasarela.obtenerCobro(sesionId);
  if (!cobro.pagado) return { pago: null, nuevo: false };
  const { tableroId, deUsuarioId, aUsuarioId, monto, notaId, concepto } = cobro.datos;
  const [miembrosIds, nota] = await Promise.all([miembros.idsDe(tableroId), notaId ? notas.porId(notaId, tableroId) : null]);

  let pago;
  try {
    pago = await pagos.crear(
      Pago.conTarjeta(
        // Si la nota ya no sirve (la borraron o cambió mientras pagaba) el pago igual cuenta, sin abonarle
        { deUsuarioId, aUsuarioId, monto: Number(monto), notaId: nota?.afectaBalance() ? notaId : undefined, concepto: concepto || 'Pago con tarjeta' },
        { tableroId, miembrosIds, nota: nota?.afectaBalance() ? nota : null, sesionId },
      ),
    );
  } catch (e) {
    // El otro aviso ganó la carrera: ya quedó registrado
    if (e.code === '23505') return { pago: await pagos.porSesionStripe(sesionId), nuevo: false };
    throw e;
  }
  avisos.publicar(tableroId, 'pago:creado', pago, { cambiaBalance: true });
  await efectoEnNota(pago, { liquidacion, avisos });
  await bitacora.registrar(tableroId, deUsuarioId, 'pago:con_tarjeta', resumenPago(pago));
  return { pago, nuevo: true };
}
