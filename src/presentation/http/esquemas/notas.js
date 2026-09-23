import { z } from 'zod';
import { uuid, fecha, dinero, booleanoQuery } from './comunes.js';

const tipo = z.enum(['gasto', 'servicio', 'prestamo', 'recordatorio']);
const estado = z.enum(['por_pagar', 'pagada', 'liquidada']);
const color = z.enum(['amarillo', 'azul', 'verde', 'rosa', 'naranja', 'morado']);

const participante = z.object({
  usuarioId: uuid,
  monto: z.number().min(0).optional(),
  porcentaje: z.number().min(0).max(100).optional(),
  proporcion: z.number().min(0).optional(),
});

/** Cómo se ve en el corcho */
const aspecto = {
  color: color.optional(),
  pinColor: z.string().trim().max(20).optional(),
  posX: z.number().finite().optional(),
  posY: z.number().finite().optional(),
  rotacion: z.number().min(-15).max(15).optional(),
  z: z.number().int().optional(),
};

const contenido = {
  titulo: z.string().trim().min(1).max(120),
  descripcion: z.string().trim().max(1000).nullable().optional(),
  categoriaId: uuid.nullable().optional(),
  monto: dinero.optional(),
  /** A meses: en gasto/servicio el monto es el TOTAL y se clavan N mensualidades; en préstamo, se paga en N meses */
  plazoMeses: z.number().int().min(2).max(60).optional(),
  modoReparto: z.enum(['igual', 'montos', 'porcentaje', 'proporcion']).optional(),
  /** Entre quién se reparte (tablero compartido). Si no se manda: todos, en partes iguales. */
  participantes: z.array(participante).min(1).max(50).optional(),
  pagadoPor: uuid.optional(),
  fecha: fecha.optional(),
  venceEn: fecha.nullable().optional(),
  recurrencia: z.enum(['ninguna', 'semanal', 'quincenal', 'mensual']).optional(),
  /** Deuda con alguien de fuera (tablero personal) */
  contraparte: z.string().trim().min(1).max(80).optional(),
  direccion: z.enum(['debo', 'me_deben']).optional(),
  /** Pagado en otra moneda: el monto del tablero lo calcula el servidor (montoOriginal × tipoCambio). null la quita */
  monedaOriginal: z.string().regex(/^[A-Za-z]{3}$/, 'Código de 3 letras').transform((m) => m.toUpperCase()).nullable().optional(),
  montoOriginal: dinero.optional(),
  tipoCambio: z.number().positive().max(1_000_000).optional(),
};

export const crear = z.object({
  tipo: tipo.default('gasto'),
  estado: z.enum(['por_pagar', 'pagada']).optional(),
  ...contenido,
  ...aspecto,
});

export const editar = z.object({
  ...contenido,
  titulo: contenido.titulo.optional(),
  pagadoPor: uuid.nullable().optional(),
  plazoMeses: contenido.plazoMeses.unwrap().nullable().optional(),
  ...aspecto,
});

export const mover = z.object({
  posX: z.number().finite(),
  posY: z.number().finite(),
  rotacion: z.number().min(-15).max(15).optional(),
  /** true = ponerla encima de todas */
  alFrente: z.boolean().optional(),
});

export const pagar = z.object({ pagadoPor: uuid.optional(), fecha: fecha.optional() });
export const abonar = z.object({ monto: dinero });

/** Movimientos ya leídos del CSV del banco: cargos → gastos, abonos → ingresos. */
export const importar = z.object({
  movimientos: z
    .array(
      z.object({
        tipo: z.enum(['gasto', 'ingreso']),
        titulo: z.string().trim().min(1).max(120),
        monto: dinero,
        fecha,
        categoriaId: uuid.nullable().optional(),
      }),
    )
    .min(1)
    .max(300),
});

export const archivar = z.object({ archivada: z.boolean() });

/** Lo que se guarda después de subir la foto a Cloudinary */
export const adjunto = z.object({
  publicId: z.string().min(1).max(300),
  url: z.string().url().max(600),
  ancho: z.number().int().positive().optional(),
  alto: z.number().int().positive().optional(),
  formato: z.string().max(10).optional(),
  bytes: z.number().int().nonnegative().optional(),
});

export const comentario = z.object({
  texto: z.string().trim().min(1).max(1000),
  menciones: z.array(uuid).max(20).optional(),
});

export const filtros = z.object({
  q: z.string().trim().max(80).optional(),
  archivadas: booleanoQuery.optional(),
  tipo: tipo.optional(),
  estado: estado.optional(),
  color: color.optional(),
  categoriaId: uuid.optional(),
  planId: uuid.optional(),
  pagadoPor: uuid.optional(),
  creadoPor: uuid.optional(),
  orden: z.enum(['z', '-z', 'fecha', '-fecha', 'venceEn', '-venceEn', 'monto', '-monto', 'numeroCuota', 'creadoEn', '-creadoEn']).optional(),
});
