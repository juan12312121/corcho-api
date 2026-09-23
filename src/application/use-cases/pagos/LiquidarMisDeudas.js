import { UseCase } from '../../shared/UseCase.js';
import { Pago } from '../../../domain/entities/Pago.js';
import { simplificar, misPagosParaQuedarAMano } from '../../../domain/services/Balance.js';
import { resumenPago } from './RegistrarPago.js';

const MAXIMO_PENDIENTES = 200;

/**
 * "Pagar todo lo que debo" con un clic: registra (pendientes de confirmar) los pagos
 * que me tocan en el plan para quedar a mano, descontando lo que ya mandé y sigue
 * sin confirmar. Todo o nada, en una transacción.
 */
export class LiquidarMisDeudas extends UseCase {
  constructor({ acceso, miembros, pagos, consultasBalance, uow, avisos, eventos, bitacora }) {
    super();
    this.acceso = acceso;
    this.miembros = miembros;
    this.pagos = pagos;
    this.consultasBalance = consultasBalance;
    this.uow = uow;
    this.avisos = avisos;
    this.eventos = eventos;
    this.bitacora = bitacora;
  }

  async ejecutar({ actor, tableroId, metodo = 'transferencia' }) {
    const { tablero } = await this.acceso.exigir(tableroId, actor.id);
    tablero.exigirCompartido();
    const [deudas, miembrosIds, pendientes] = await Promise.all([
      this.consultasBalance.deudasDe(tableroId),
      this.miembros.idsDe(tableroId),
      this.pagos.listar(tableroId, { filtros: { deUsuarioId: actor.id, estado: 'pendiente' }, porPagina: MAXIMO_PENDIENTES }),
    ]);
    const porPagar = misPagosParaQuedarAMano(simplificar(deudas), actor.id, pendientes.items);
    if (!porPagar.length) return { pagos: [] };

    const pagos = await this.uow.ejecutar((repos) =>
      Promise.all(
        porPagar.map((s) =>
          repos.pagos.crear(
            Pago.registrar(
              { deUsuarioId: actor.id, aUsuarioId: s.a, monto: s.monto, metodo, concepto: 'Para quedar a mano' },
              { tableroId, autorId: actor.id, miembrosIds },
            ),
          ),
        ),
      ),
    );
    for (const pago of pagos) {
      this.avisos.publicar(tableroId, 'pago:creado', pago);
      this.eventos.aUsuario(pago.aUsuarioId, 'pago:por_confirmar', pago);
      await this.bitacora.registrar(tableroId, actor.id, 'pago:registrado', resumenPago(pago));
    }
    return { pagos };
  }
}
