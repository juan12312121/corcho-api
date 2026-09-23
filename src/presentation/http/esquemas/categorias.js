import { z } from 'zod';
import { colorHex } from './comunes.js';

const campos = {
  nombre: z.string().trim().min(1).max(40),
  /** Nombre de un ícono de Material Symbols (shopping_cart, pets, school…) */
  icono: z.string().regex(/^[a-z0-9_]{1,40}$/, 'Ícono inválido'),
  color: colorHex,
};

export const crear = z.object({ ...campos, icono: campos.icono.optional(), color: campos.color.optional() });
export const editar = z.object({ nombre: campos.nombre.optional(), icono: campos.icono.optional(), color: campos.color.optional() });
