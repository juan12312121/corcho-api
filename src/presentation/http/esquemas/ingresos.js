import { z } from 'zod';
import { fecha, dinero } from './comunes.js';

export const crear = z.object({
  concepto: z.string().trim().min(1).max(80),
  monto: dinero,
  fecha: fecha.optional(),
  /** true = cuenta cada mes desde su fecha (sueldo) */
  recurrente: z.boolean().optional(),
});
