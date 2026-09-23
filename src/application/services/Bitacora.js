import { Actividad } from '../../domain/entities/Actividad.js';

/** Anota lo que pasa en un tablero y lo avisa en vivo. Se llama después de confirmar cada acción. */
export class Bitacora {
  constructor({ actividad, eventos }) {
    this.actividad = actividad;
    this.eventos = eventos;
  }

  async registrar(tableroId, usuarioId, tipo, datos = {}) {
    const linea = await this.actividad.crear(Actividad.registrar(tableroId, usuarioId, tipo, datos));
    this.eventos.aTablero(tableroId, 'actividad:nueva', linea);
    return linea;
  }
}
