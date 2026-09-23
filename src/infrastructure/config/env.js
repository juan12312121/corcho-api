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

  /** Correo (recuperar contraseña). Sin SMTP_HOST, el correo se imprime en la consola. */
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  CORREO_REMITENTE: z.string().default('Corcho <no-responder@corcho.app>'),

  /** Token que manda n8n en X-Integracion-Token para pedir los recordatorios. Sin él, la ruta está apagada. */
  INTEGRACION_TOKEN: z.string().min(24).optional(),
});

const resultado = esquema.safeParse(process.env);
if (!resultado.success) {
  console.error('Variables de entorno inválidas:', resultado.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = resultado.data;
