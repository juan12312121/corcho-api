import { UseCase } from '../../shared/UseCase.js';

/** Nombre, descripción, moneda, fondo o archivar. Solo admins. */
export class ActualizarTablero extends UseCase {
  constructor({ acceso, tableros, eventos, bitacora }) {
    super();
    this.acceso = acceso;
    this.tableros = tableros;
    this.eventos = eventos;
    this.bitacora = bitacora;
  }

  async ejecutar({ actor, tableroId, ...cambios }) {
    const { tablero } = await this.acceso.exigir(tableroId, actor.id, 'admin');
    tablero.actualizar(cambios);
    const guardado = await this.tableros.guardar(tablero);
    this.eventos.aTablero(tableroId, 'tablero:actualizado', guardado);
    await this.bitacora.registrar(tableroId, actor.id, 'tablero:actualizado', {});
    return guardado;
  }
}
