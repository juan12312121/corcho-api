import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { ApiResponse } from './ApiResponse.js';
import { NoAutenticadoError } from '../../application/shared/errors.js';

/**
 * Exige "Authorization: Bearer <token>" y deja { id, email } en req.actor.
 * @param {import('../../application/ports/TokenService.js').TokenService} tokens
 */
export const autenticar = (tokens) => (req, _res, next) => {
  const cabecera = req.headers.authorization ?? '';
  if (!cabecera.startsWith('Bearer ')) return next(new NoAutenticadoError());
  try {
    req.actor = tokens.verificar(cabecera.slice(7));
    next();
  } catch (e) {
    next(e);
  }
};

/**
 * Rutas de automatización (n8n): exigen el header X-Integracion-Token.
 * Sin token configurado en el servidor, la ruta no existe (404).
 */
export const tokenIntegracion = (esperado) => (req, res, next) => {
  if (!esperado) return ApiResponse.error(res, 404, 'RUTA_NO_ENCONTRADA', 'Integración apagada');
  const recibido = Buffer.from(String(req.get('x-integracion-token') ?? ''));
  const correcto = Buffer.from(esperado);
  if (recibido.length !== correcto.length || !crypto.timingSafeEqual(recibido, correcto)) return next(new NoAutenticadoError('Token de integración inválido'));
  next();
};

/** Freno contra fuerza bruta en login/registro: 20 intentos por IP cada 15 minutos. */
export const limiteAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => ApiResponse.error(res, 429, 'DEMASIADOS_INTENTOS', 'Demasiados intentos, espera unos minutos'),
});

/** Límite general amplio (el tablero hace muchas peticiones al mover notas). */
export const limiteGeneral = rateLimit({
  windowMs: 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => ApiResponse.error(res, 429, 'DEMASIADAS_PETICIONES', 'Demasiadas peticiones, baja el ritmo'),
});
