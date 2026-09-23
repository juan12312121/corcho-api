import 'dotenv/config';
import { z } from 'zod';

const esquema = z.object({
  PORT: z.coerce.number().default(3000),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().default('postgres'),
  DB_SSL: z.string().default('true').transform((v) => v === 'true'),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRA: z.string().default('7d'),
  CORS_ORIGEN: z
    .string()
    .default('*')
    .transform((v) => (v.trim() === '*' ? '*' : v.split(',').map((o) => o.trim()).filter(Boolean))),
  INVITACION_DIAS: z.coerce.number().int().positive().default(7),
  /** Dónde vive el frontend (para los enlaces de los correos). */
  URL_FRONTEND: z.string().url().default('http://localhost:4300'),

  /** Fotos de tickets. Sin estas tres variables, subir fotos responde 503. */
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  /** Correo (recuperar contraseña) por un webhook de n8n. Sin URL, el correo se imprime en la consola. */
  N8N_CORREOS_URL: z.string().url().optional(),
  N8N_CORREOS_TOKEN: z.string().min(24).optional(),

  /** Pagos con tarjeta (Stripe Connect). Sin la llave secreta, pagar con tarjeta responde 503. */
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  /** Para verificar los avisos (webhook) de Stripe: whsec_… */
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  /** Token que manda n8n en X-Integracion-Token para pedir los recordatorios. Sin él, la ruta está apagada. */
  INTEGRACION_TOKEN: z.string().min(24).optional(),
});

const resultado = esquema
  .refine((e) => !e.N8N_CORREOS_URL || e.N8N_CORREOS_TOKEN, { message: 'Falta N8N_CORREOS_TOKEN', path: ['N8N_CORREOS_TOKEN'] })
  // Una variable vacía (`N8N_CORREOS_URL=`) cuenta como no configurada, no como inválida
  .safeParse(Object.fromEntries(Object.entries(process.env).filter(([, valor]) => valor !== '')));
if (!resultado.success) {
  console.error('Variables de entorno inválidas:', resultado.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = resultado.data;
