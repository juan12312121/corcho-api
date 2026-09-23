import { z } from 'zod';
import { uuid, fecha, dinero, paginacion } from './comunes.js';

export const registrar = z.object({
  /** Si no se manda, quien paga es quien registra */
  deUsuarioId: uuid.optional(),
  aUsuarioId: uuid,
  monto: dinero,
  /** Opcional: abona a una nota concreta (la liquida al cubrirla) */
  notaId: uuid.optional(),
  concepto: z.string().trim().max(200).nullable().optional(),
  metodo: z.enum(['efectivo', 'transferencia', 'tarjeta', 'otro']).optional(),
  fecha: fecha.optional(),
});

export const liquidar = z.object({ metodo: z.enum(['efectivo', 'transferencia', 'tarjeta', 'otro']).optional() });

export const filtros = z.object({
  ...paginacion,
  estado: z.enum(['pendiente', 'confirmado', 'rechazado']).optional(),
  deUsuarioId: uuid.optional(),
  aUsuarioId: uuid.optional(),
  notaId: uuid.optional(),
});
