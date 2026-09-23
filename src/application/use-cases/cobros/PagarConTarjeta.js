import { UseCase } from '../../shared/UseCase.js';
import { ReglaDeNegocioError } from '../../../domain/shared/errors.js';
import { Pago } from '../../../domain/entities/Pago.js';
import { comisionTarjeta, MINIMO_CON_TARJETA } from '../../../domain/services/ComisionTarjeta.js';
import { PasarelaNoConfiguradaError } from '../../ports/PasarelaPagos.js';

const MONEDAS = ['MXN'];

/**
 * Abre la página de pago de Stripe para pagarle a otro miembro. El pago todavía NO se
 * registra: se registra ya confirmado cuando la pasarela avisa que se cobró.
 */
export class PagarConTarjeta extends UseCase {
  constructor({ acceso, miembros, usuarios, notas, pasarela, urlFrontend }) {
    super();
    this.acceso = acceso;
    this.miembros = miembros;
    this.usuarios = usuarios;
    this.notas = notas;
    this.pasarela = pasarela;
    this.urlFrontend = urlFrontend;
  }

  async ejecutar({ actor, tableroId, aUsuarioId, monto, notaId, concepto }) {
    if (!this.pasarela.estaConfigurada()) throw new PasarelaNoConfiguradaError();
    const { tablero } = await this.acceso.exigir(tableroId, actor.id);
    tablero.exigirCompartido();
    if (!MONEDAS.includes(tablero.moneda)) throw new ReglaDeNegocioError('MONEDA_SIN_TARJETA', `Con tarjeta solo se paga en ${MONEDAS.join(', ')}`);
    if (monto < MINIMO_CON_TARJETA) throw new ReglaDeNegocioError('MONTO_MINIMO', `Con tarjeta el mínimo es $${MINIMO_CON_TARJETA}`);

    const [miembrosIds, nota, yo, quienCobra] = await Promise.all([
      this.miembros.idsDe(tableroId),
      notaId ? this.notas.porId(notaId, tableroId) : null,
      this.usuarios.porId(actor.id),
      this.usuarios.porId(aUsuarioId),
    ]);
    // Mismas reglas que un pago normal (miembros, nota que abona, monto): se valida antes de cobrar
    Pago.registrar({ deUsuarioId: actor.id, aUsuarioId, monto, notaId }, { tableroId, autorId: actor.id, miembrosIds, nota });
    if (!quienCobra?.stripeListo || !quienCobra.stripeCuentaId)
      throw new ReglaDeNegocioError('NO_COBRA_CON_TARJETA', `${quienCobra?.nombre ?? 'Esa persona'} todavía no conecta su cuenta para cobrar con tarjeta`);

    const { comision, total } = comisionTarjeta(monto);
    const volver = `${this.urlFrontend}/tableros/${tableroId}`;
    const cobro = await this.pasarela.crearCobro({
      monto,
      comision,
      moneda: tablero.moneda,
      destino: quienCobra.stripeCuentaId,
      concepto: concepto?.trim() || `Pago a ${quienCobra.nombre} (${tablero.nombre})`,
      email: yo?.email,
      // Todo lo que hace falta para registrar el pago cuando se cobre
      datos: { tableroId, deUsuarioId: actor.id, aUsuarioId, monto: String(monto), notaId: notaId ?? '', concepto: concepto ?? '' },
      exito: `${volver}?pago=exito&sesion={CHECKOUT_SESSION_ID}`,
      cancelar: `${volver}?pago=cancelado`,
    });
    return { url: cobro.url, sesion: cobro.id, comision, total };
  }
}
