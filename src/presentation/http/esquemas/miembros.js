import { z } from 'zod';

export const editar = z.object({
  rol: z.enum(['admin', 'miembro']).optional(),
  apodo: z.string().trim().max(40).nullable().optional(),
});
