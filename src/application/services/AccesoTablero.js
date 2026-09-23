import { NoEncontradoError } from '../shared/errors.js';
import { PermisoDenegadoError } from '../../domain/shared/errors.js';

/**
 * Puerta de entrada a cualquier cosa dentro de un tablero: comprueba que el
 * usuario sea miembro (y con el rol pedido). A quien no es miembro le dice
 * "no encontrado" para no confirmarle que el tablero existe.
 */
export class AccesoTablero {
  /** @param {{ tableros: import('../../domain/repositories/TableroRepository.js').TableroRepository, miembros: import('../../domain/repositories/MiembroRepository.js').MiembroRepository }} deps */
  constructor({ tableros, miembros }) {
    this.tableros = tableros;
    this.miembros = miembros;
  }

  /** @returns {Promise<{ tablero: import('../../domain/entities/Tablero.js').Tablero, miembro: import('../../domain/entities/Miembro.js').Miembro }>} */
  async exigir(tableroId, usuarioId, rolMinimo = 'miembro') {
    const miembro = await this.miembros.de(tableroId, usuarioId);
    if (!miembro) throw new NoEncontradoError('Tablero no encontrado');
    if (!miembro.tieneRango(rolMinimo)) throw new PermisoDenegadoError(`Necesitas ser ${rolMinimo} del tablero`);
    return { tablero: await this.tableros.porId(tableroId), miembro };
  }

  async esMiembro(tableroId, usuarioId) {
    return Boolean(await this.miembros.de(tableroId, usuarioId));
  }
}
