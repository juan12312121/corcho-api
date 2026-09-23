import { z } from 'zod';
import { colorHex } from './comunes.js';

export const registro = z.object({
  nombre: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(72),
  color: colorHex.optional(),
});

export const login = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const perfil = z
  .object({
    nombre: z.string().trim().min(1).max(80).optional(),
    color: colorHex.optional(),
    avatarUrl: z.string().url().nullable().optional(),
    /** Celular a 10 dígitos (o con lada); null lo borra */
    telefono: z.string().trim().max(20).nullable().optional(),
    avisosWhatsapp: z.boolean().optional(),
    /** Datos para que te transfieran; null borra la CLABE */
    clabe: z.string().trim().max(24).nullable().optional(),
    banco: z.string().trim().max(60).nullable().optional(),
    titularCuenta: z.string().trim().max(80).nullable().optional(),
    password: z.string().min(8).max(72).optional(),
    passwordActual: z.string().optional(),
  })
  .refine((d) => !d.password || d.passwordActual, { message: 'Para cambiar la contraseña manda passwordActual', path: ['passwordActual'] });

export const recuperar = z.object({ email: z.string().trim().toLowerCase().email() });

export const restablecer = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(72),
});
