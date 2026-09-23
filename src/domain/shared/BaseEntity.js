/**
 * Base de todas las entidades. Una entidad se identifica por su id y
 * protege sus reglas en métodos; nunca se modifica "desde afuera" campo por campo.
 *
 * `static privados` lista los campos que jamás salen en toJSON (p. ej. passwordHash).
 */
export class BaseEntity {
  static privados = [];

  constructor(props = {}) {
    Object.assign(this, props);
  }

  equals(otra) {
    return otra instanceof this.constructor && otra.id !== undefined && otra.id === this.id;
  }

  /** Copia superficial con cambios (útil en pruebas y al clonar). */
  con(cambios) {
    return new this.constructor({ ...this, ...cambios });
  }

  toJSON() {
    const privados = this.constructor.privados;
    return Object.fromEntries(Object.entries(this).filter(([k]) => !privados.includes(k)));
  }
}
