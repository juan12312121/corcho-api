import { BaseEntity } from '../shared/BaseEntity.js';
import { ReglaDeNegocioError } from '../shared/errors.js';

export const TIPOS_TABLERO = ['personal', 'compartido'];

/**
 * Un tablero de corcho.
 *  - personal:   solo su dueño; gastos propios, recibos y deudas con gente de fuera.
 *  - compartido: con familia/amigos invitados; los gastos se reparten entre miembros.
 */
export class Tablero extends BaseEntity {
  static crear({ nombre, descripcion = null, moneda = 'MXN', fondo = 'corcho', tipo = 'compartido', propietarioId }) {
    if (!TIPOS_TABLERO.includes(tipo)) throw new ReglaDeNegocioError('TIPO_INVALIDO', `Tipo de tablero desconocido: ${tipo}`);
    return new Tablero({
      nombre: Tablero.#nombreValido(nombre),
      descripcion,
      moneda: moneda.toUpperCase(),
      fondo,
      tipo,
      propietarioId,
      archivado: false,
    });
  }

  static #nombreValido(nombre) {
    const limpio = String(nombre ?? '').trim();
    if (!limpio || limpio.length > 80) throw new ReglaDeNegocioError('NOMBRE_INVALIDO', 'El nombre debe tener de 1 a 80 caracteres');
    return limpio;
  }

  esPersonal() {
    return this.tipo === 'personal';
  }

  exigirCompartido() {
    if (this.esPersonal())
      throw new ReglaDeNegocioError('TABLERO_PERSONAL', 'Un tablero personal no admite invitados; conviértelo en compartido primero');
  }

  actualizar({ nombre, descripcion, moneda, fondo, archivado }) {
    if (nombre !== undefined) this.nombre = Tablero.#nombreValido(nombre);
    if (descripcion !== undefined) this.descripcion = descripcion;
    if (moneda !== undefined) this.moneda = moneda.toUpperCase();
    if (fondo !== undefined) this.fondo = fondo;
    if (archivado !== undefined) this.archivado = archivado;
  }

  /** Volverlo personal solo se puede si ya no queda nadie más en él. */
  cambiarTipo(tipo, { cantidadMiembros }) {
    if (!TIPOS_TABLERO.includes(tipo)) throw new ReglaDeNegocioError('TIPO_INVALIDO', `Tipo de tablero desconocido: ${tipo}`);
    if (tipo === 'personal' && cantidadMiembros > 1)
      throw new ReglaDeNegocioError('TIENE_MIEMBROS', 'Para volverlo personal primero deben salir los demás miembros');
    this.tipo = tipo;
  }

  transferirA(usuarioId) {
    this.propietarioId = usuarioId;
  }
}
