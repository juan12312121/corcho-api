import { BaseEntity } from '../shared/BaseEntity.js';
import { ReglaDeNegocioError } from '../shared/errors.js';

/** Categorías con las que arranca cada tablero; luego cada quien agrega las suyas. */
export const CATEGORIAS_BASE = [
  { nombre: 'Súper', icono: 'shopping_cart', color: '#2E9E5B' },
  { nombre: 'Comida', icono: 'restaurant', color: '#F26B21' },
  { nombre: 'Servicios', icono: 'bolt', color: '#F2B705' },
  { nombre: 'Renta', icono: 'home', color: '#1E4FA3' },
  { nombre: 'Transporte', icono: 'directions_car', color: '#00A6A6' },
  { nombre: 'Salud', icono: 'medical_services', color: '#D64545' },
  { nombre: 'Diversión', icono: 'celebration', color: '#8A4FD6' },
  { nombre: 'Otros', icono: 'category', color: '#775836' },
];

const COLOR = /^#[0-9a-fA-F]{6}$/;
const ICONO = /^[a-z0-9_]{1,40}$/;

/** Categoría de gasto de un tablero (personalizable: nombre, ícono y color). */
export class Categoria extends BaseEntity {
  static crear({ tableroId, nombre, icono = 'sell', color = '#775836', creadoPor = null }) {
    const c = new Categoria({ tableroId, creadoPor });
    c.cambiar({ nombre, icono, color });
    return c;
  }

  static baseDe(tableroId) {
    return CATEGORIAS_BASE.map((c) => Categoria.crear({ ...c, tableroId }));
  }

  cambiar({ nombre, icono, color }) {
    if (nombre !== undefined) {
      const limpio = String(nombre).trim();
      if (!limpio || limpio.length > 40) throw new ReglaDeNegocioError('NOMBRE_INVALIDO', 'El nombre de la categoría va de 1 a 40 caracteres');
      this.nombre = limpio;
    }
    if (icono !== undefined) {
      if (!ICONO.test(icono)) throw new ReglaDeNegocioError('ICONO_INVALIDO', 'Ícono inválido');
      this.icono = icono;
    }
    if (color !== undefined) {
      if (!COLOR.test(color)) throw new ReglaDeNegocioError('COLOR_INVALIDO', 'Color en formato #RRGGBB');
      this.color = color;
    }
  }

  /** Quien la creó o un admin la puede cambiar; las de base, solo admins. */
  puedeModificarla(miembro) {
    return miembro.tieneRango('admin') || (this.creadoPor !== null && this.creadoPor === miembro.usuarioId);
  }
}
