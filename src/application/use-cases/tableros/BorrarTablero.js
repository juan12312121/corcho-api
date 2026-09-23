import { UseCase } from '../../shared/UseCase.js';
import { borrarArchivos } from '../archivos/BorrarAdjunto.js';

/** Borra el tablero con todo su contenido. Solo el propietario. */
export class BorrarTablero extends UseCase {
  constructor({ acceso, tableros, adjuntos, almacen, eventos }) {
    super();
    this.adjuntos = adjuntos;
    this.almacen = almacen;
    this.acceso = acceso;
    this.tableros = tableros;
    this.eventos = eventos;
  }

  async ejecutar({ actor, tableroId }) {
    await this.acceso.exigir(tableroId, actor.id, 'propietario');
    const fotos = await this.adjuntos.deTablero(tableroId);
    await this.tableros.borrar(tableroId);
    await borrarArchivos(this.almacen, fotos);
    this.eventos.aTablero(tableroId, 'tablero:borrado', { id: tableroId });
  }
}
