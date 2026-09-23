import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';
import { efectoEnNota, resumenPago } from './RegistrarPago.js';

/** Quien recibe confirma ("sí me llegó") o rechaza un pago pendiente. */
export class DecidirPago extends UseCase {
  constructor({ acceso, pagos, liquidacion, avisos, bitacora }) {
    super();
    this.acceso = acceso;
    this.pagos = pagos;
    this.liquidacion = liquidacion;
    this.avisos = avisos;
    this.bitacora = bitacora;
  }

  /** @param {{ decision: 'confirmar' | 'rechazar' }} entrada */
  async ejecutar({ actor, tableroId, pagoId, decision }) {
    await this.acceso.exigir(tableroId, actor.id);
    const pago = await this.pagos.porId(pagoId, tableroId);
    if (!pago) throw new NoEncontradoError('Pago no encontrado');

    if (decision === 'confirmar') pago.confirmar(actor.id);
    else pago.rechazar(actor.id);
    const guardado = await this.pagos.guardar(pago);

    this.avisos.publicar(tableroId, 'pago:actualizado', guardado, { cambiaBalance: guardado.cuentaEnBalance() });
    if (guardado.cuentaEnBalance()) await efectoEnNota(guardado, this);
    await this.bitacora.registrar(tableroId, actor.id, `pago:${guardado.estado}`, resumenPago(guardado));
    return guardado;
  }
}
