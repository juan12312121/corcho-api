import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';
import { efectoEnNota, resumenPago } from './RegistrarPago.js';

export class AnularPago extends UseCase {
  constructor({ acceso, pagos, liquidacion, avisos, bitacora }) {
    super();
    this.acceso = acceso;
    this.pagos = pagos;
    this.liquidacion = liquidacion;
    this.avisos = avisos;
    this.bitacora = bitacora;
  }

  async ejecutar({ actor, tableroId, pagoId }) {
    await this.acceso.exigir(tableroId, actor.id);
    const pago = await this.pagos.porId(pagoId, tableroId);
    if (!pago) throw new NoEncontradoError('Pago no encontrado');
    pago.exigirPuedeAnular(actor.id);

    await this.pagos.borrar(pagoId);
    this.avisos.publicar(tableroId, 'pago:borrado', { id: pagoId }, { cambiaBalance: pago.cuentaEnBalance() });
    if (pago.cuentaEnBalance()) await efectoEnNota(pago, this);
    await this.bitacora.registrar(tableroId, actor.id, 'pago:anulado', resumenPago(pago));
  }
}
