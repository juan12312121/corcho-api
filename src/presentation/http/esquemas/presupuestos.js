import { z } from 'zod';
import { uuid, dinero } from './comunes.js';

export const guardar = z.object({ categoriaId: uuid, montoMensual: dinero });
