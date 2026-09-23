import { z } from 'zod';
import { booleanoQuery } from './comunes.js';

const tipo = z.enum(['personal', 'compartido']);
const campos = {
  nombre: z.string().trim().min(1).max(80),
  descripcion: z.string().trim().max(500).nullable().optional(),
  moneda: z.string().trim().length(3).optional(),
  fondo: z.string().trim().max(40).optional(),
};

export const crear = z.object({ ...campos, tipo: tipo.default('compartido') });
export const editar = z.object({ ...campos, nombre: campos.nombre.optional(), archivado: z.boolean().optional() });
export const cambiarTipo = z.object({ tipo });
export const listar = z.object({ archivado: booleanoQuery.optional(), tipo: tipo.optional() });
