import { UseCase } from '../../shared/UseCase.js';

/**
 * Personal ⇄ compartido. Un personal se vuelve compartido para poder invitar;
 * uno compartido vuelve a personal solo si ya no hay nadie más (y se cancelan sus invitaciones).
 */
export class CambiarTipoTablero extends UseCase {
  constructor({ acceso, miembros, uow, eventos, bitacora }) {
    super();
    this.acceso = acceso;
    this.miembros = miembros;
    this.uow = uow;
    this.eventos = eventos;
    this.bitacora = bitacora;
  }

  async ejecutar({ actor, tableroId, tipo }) {
    const { tablero } = await this.acceso.exigir(tableroId, actor.id, 'propietario');
    if (tablero.tipo === tipo) return tablero;
    tablero.cambiarTipo(tipo, { cantidadMiembros: (await this.miembros.idsDe(tableroId)).length });

    const guardado = await this.uow.ejecutar(async (repos) => {
      if (tablero.esPersonal()) await repos.invitaciones.cancelarPendientes(tableroId);
      return repos.tableros.guardar(tablero);
    });
    this.eventos.aTablero(tableroId, 'tablero:actualizado', guardado);
    await this.bitacora.registrar(tableroId, actor.id, 'tablero:tipo', { tipo });
    return guardado;
  }
}
