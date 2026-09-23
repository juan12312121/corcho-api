import { z } from 'zod';
import { uuid, dinero } from './comunes.js';

export const pagar = z.object({
  aUsuarioId: uuid,
  monto: dinero,
  notaId: uuid.optional(),
  concepto: z.string().trim().max(200).optional(),
});
