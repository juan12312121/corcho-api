import { z } from 'zod';

export const uuid = z.string().uuid();
export const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha en formato AAAA-MM-DD');
export const dinero = z.number().positive().max(999_999_999).multipleOf(0.01, 'Máximo 2 decimales');
export const colorHex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color en formato #RRGGBB');
export const booleanoQuery = z.enum(['true', 'false']).transform((v) => v === 'true');

export const paginacion = {
  pagina: z.coerce.number().int().positive().optional(),
  porPagina: z.coerce.number().int().min(1).max(200).optional(),
};
