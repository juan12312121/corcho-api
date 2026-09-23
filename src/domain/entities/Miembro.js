import { BaseEntity } from '../shared/BaseEntity.js';
import { ReglaDeNegocioError } from '../shared/errors.js';

export const RANGO = { miembro: 1, admin: 2, propietario: 3 };

/** La membresía de un usuario en un tablero, con su rol. */
export class Miembro extends BaseEntity {
  static nuevo(tableroId, usuarioId, rol = 'miembro') {
    if (!RANGO[rol]) throw new ReglaDeNegocioError('ROL_INVALIDO', `Rol desconocido: ${rol}`);
    return new Miembro({ tableroId, usuarioId, rol, apodo: null });
  }

  static propietario(tableroId, usuarioId) {
    return Miembro.nuevo(tableroId, usuarioId, 'propietario');
  }

  tieneRango(minimo) {
    return (RANGO[this.rol] ?? 0) >= RANGO[minimo];
  }

  esPropietario() {
    return this.rol === 'propietario';
  }

  esElMismoQue(otro) {
    return this.usuarioId === otro.usuarioId;
  }

  puedeCambiarRolDe(objetivo) {
    return this.tieneRango('admin') && !objetivo.esPropietario();
  }

  /** Salirse uno mismo, o que un admin saque a un miembro (a un admin solo lo saca el propietario). */
  puedeSacarA(objetivo) {
    if (objetivo.esPropietario()) return false;
    if (this.esElMismoQue(objetivo)) return true;
    return objetivo.rol === 'admin' ? this.esPropietario() : this.tieneRango('admin');
  }

  asignarRol(rol) {
    if (!['admin', 'miembro'].includes(rol)) throw new ReglaDeNegocioError('ROL_INVALIDO', 'Solo se puede asignar admin o miembro');
    this.rol = rol;
  }

  /** Transferencia del tablero: el propietario queda como admin y el otro como propietario. */
  cederPropiedadA(otro) {
    if (!this.esPropietario()) throw new ReglaDeNegocioError('NO_ES_PROPIETARIO', 'Solo el propietario puede ceder el tablero');
    this.rol = 'admin';
    otro.rol = 'propietario';
  }

  ponerApodo(apodo) {
    this.apodo = apodo?.trim() || null;
  }
}
