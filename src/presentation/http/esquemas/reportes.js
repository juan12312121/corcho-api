import { z } from 'zod';

export const consulta = z.object({ meses: z.coerce.number().int().min(1).max(24).optional() });
