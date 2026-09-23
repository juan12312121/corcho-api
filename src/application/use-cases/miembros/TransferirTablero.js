import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';
import { ReglaDeNegocioError } from '../../../domain/shared/errors.js';

/** El propietario le pasa el tablero a otro miembro y queda como admin. */
export class TransferirTablero extends UseCase {
  constructor({ acceso, miembros, uow, eventos, bitacora }) {
    super();
    this.acceso = acceso;
    this.miembros = miembros;
    this.uow = uow;
    this.eventos = eventos;
    this.bitacora = bitacora;
  }

  async ejecutar({ actor, tableroId, usuarioId }) {
    const { tablero, miembro: yo } = await this.acceso.exigir(tableroId, actor.id, 'propietario');
    if (usuarioId === actor.id) throw new ReglaDeNegocioError('YA_ERES_PROPIETARIO', 'Ya eres el propietario');
    const nuevo = await this.miembros.de(tableroId, usuarioId);
    if (!nuevo) throw new NoEncontradoError('Esa persona no está en el tablero');

    yo.cederPropiedadA(nuevo);
    tablero.transferirA(usuarioId);
    await this.uow.ejecutar(async (repos) => {
      await repos.miembros.guardar(yo);
      await repos.miembros.guardar(nuevo);
      await repos.tableros.guardar(tablero);
    });

    const miembros = await this.miembros.listarConUsuarios(tableroId);
    this.eventos.aTablero(tableroId, 'miembro:actualizado', { transferencia: true, miembros });
    await this.bitacora.registrar(tableroId, actor.id, 'tablero:transferido', { a: usuarioId });
    return miembros;
  }
}
