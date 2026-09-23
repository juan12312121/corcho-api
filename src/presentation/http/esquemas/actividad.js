import { z } from 'zod';
import { paginacion } from './comunes.js';

export const filtros = z.object({ ...paginacion, tipo: z.string().max(40).optional() });
