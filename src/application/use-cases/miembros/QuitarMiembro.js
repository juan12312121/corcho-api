import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError, ConflictoError } from '../../shared/errors.js';
import { PermisoDenegadoError } from '../../../domain/shared/errors.js';
import { netos } from '../../../domain/services/Balance.js';

/** Sacar a alguien (admin) o salirse (uno mismo). Nadie sale con saldo pendiente. */
export class QuitarMiembro extends UseCase {
  constructor({ acceso, miembros, consultasBalance, eventos, bitacora }) {
    super();
    this.acceso = acceso;
    this.miembros = miembros;
    this.consultasBalance = consultasBalance;
    this.eventos = eventos;
    this.bitacora = bitacora;
  }

  async ejecutar({ actor, tableroId, usuarioId = actor.id }) {
    const { miembro: yo } = await this.acceso.exigir(tableroId, actor.id);
    const objetivo = await this.miembros.de(tableroId, usuarioId);
    if (!objetivo) throw new NoEncontradoError('Esa persona no está en el tablero');
    if (!yo.puedeSacarA(objetivo))
      throw new PermisoDenegadoError(objetivo.esPropietario() ? 'El propietario no puede salir; transfiere el tablero primero' : 'No puedes sacar a esa persona');

    const saldo = netos(await this.consultasBalance.deudasDe(tableroId))[usuarioId] ?? 0;
    if (saldo !== 0) {
      const mensaje = saldo < 0 ? `Aún debe ${-saldo} en este tablero` : `Aún le deben ${saldo} en este tablero`;
      throw new ConflictoError('SALDO_PENDIENTE', mensaje, [{ neto: saldo }]);
    }

    await this.miembros.borrar(objetivo.id);
    const salioSolo = yo.esElMismoQue(objetivo);
    this.eventos.aTablero(tableroId, 'miembro:salio', { usuarioId });
    this.eventos.aUsuario(usuarioId, 'tablero:expulsado', { tableroId, porMi: salioSolo });
    await this.bitacora.registrar(tableroId, actor.id, salioSolo ? 'miembro:salio' : 'miembro:sacado', { usuarioId });
  }
}
