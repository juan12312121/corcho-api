import { z } from 'zod';

/** Sin email = enlace para compartir (WhatsApp); con email = invitación personal de un uso. */
export const crear = z.object({
  email: z.string().trim().toLowerCase().email().optional(),
  rol: z.enum(['admin', 'miembro']).optional(),
  usosMax: z.number().int().positive().max(100).optional(),
  dias: z.number().int().min(1).max(30).optional(),
});
