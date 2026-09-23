import { z } from 'zod';
import { fecha, dinero, colorHex } from './comunes.js';

export const crear = z.object({
  nombre: z.string().trim().min(1).max(60),
  objetivo: dinero,
  fechaLimite: fecha.nullable().optional(),
  color: colorHex.optional(),
});

/** Positivo = aporte; negativo = retiro */
export const aportar = z.object({
  monto: z.number().refine((n) => n !== 0 && Math.abs(n) <= 999_999_999, 'Monto distinto de cero').refine((n) => Math.round(n * 100) / 100 === n, 'Máximo 2 decimales'),
  fecha: fecha.optional(),
});
