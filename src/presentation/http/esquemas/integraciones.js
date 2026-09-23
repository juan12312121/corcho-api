import { z } from 'zod';

export const recordatorios = z.object({ diasAntes: z.coerce.number().int().min(0).max(7).optional() });
