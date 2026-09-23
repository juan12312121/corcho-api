import { UseCase } from '../../shared/UseCase.js';
import { Pago } from '../../../domain/entities/Pago.js';

/** "Le pagué a Ana" (queda pendiente) o "Beto me pagó" (confirmado). Solo en tableros compartidos. */
export class RegistrarPago extends UseCase {
  constructor({ acceso, miembros, notas, pagos, liquidacion, avisos, eventos, bitacora }) {
    super();
    this.acceso = acceso;
    this.miembros = miembros;
    this.notas = notas;
    this.pagos = pagos;
    this.liquidacion = liquidacion;
    this.avisos = avisos;
    this.eventos = eventos;
    this.bitacora = bitacora;
  }

  async ejecutar({ actor, tableroId, ...datos }) {
    const { tablero } = await this.acceso.exigir(tableroId, actor.id);
    tablero.exigirCompartido();
    const [miembrosIds, nota] = await Promise.all([
      this.miembros.idsDe(tableroId),
      datos.notaId ? this.notas.porId(datos.notaId, tableroId) : null,
    ]);
    const pago = await this.pagos.crear(Pago.registrar(datos, { tableroId, autorId: actor.id, miembrosIds, nota }));

    this.avisos.publicar(tableroId, 'pago:creado', pago, { cambiaBalance: pago.cuentaEnBalance() });
    if (pago.cuentaEnBalance()) await efectoEnNota(pago, this);
    else this.eventos.aUsuario(pago.aUsuarioId, 'pago:por_confirmar', pago);
    await this.bitacora.registrar(tableroId, actor.id, 'pago:registrado', resumenPago(pago));
    return pago;
  }
}

/** Un pago confirmado o anulado puede liquidar (o reabrir) la nota a la que abona. */
export async function efectoEnNota(pago, { liquidacion, avisos }) {
  if (!pago.notaId) return;
  const nota = await liquidacion.recalcularPorId(pago.notaId, pago.tableroId);
  if (nota) avisos.publicar(pago.tableroId, 'nota:actualizada', nota);
}

export const resumenPago = (p) => ({ pagoId: p.id, de: p.deUsuarioId, a: p.aUsuarioId, monto: p.monto, notaId: p.notaId });
