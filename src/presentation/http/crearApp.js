import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ApiResponse } from './ApiResponse.js';
import { limiteGeneral } from './middlewares.js';
import { manejarErrores, rutaNoEncontrada } from './errores.js';

/**
 * Arma la app Express con las rutas que le pasa la composición.
 * @param {{ rutas: Array<[string, import('express').Router]>, corsOrigen: string | string[] }} opciones
 */
export function crearApp({ rutas, corsOrigen }) {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: corsOrigen }));
  app.use(express.json({ limit: '100kb', verify: (req, _res, crudo) => (req.cuerpoCrudo = crudo) }));

  app.get('/', (_req, res) => ApiResponse.enviar(res, 200, { nombre: 'Corcho — tablero de deudas', version: '2.0.0' }));
  app.get('/salud', (_req, res) => ApiResponse.enviar(res, 200, { ok: true, hora: new Date().toISOString() }));

  app.use(limiteGeneral);
  for (const [prefijo, router] of rutas) app.use(prefijo, router);

  app.use(rutaNoEncontrada);
  app.use(manejarErrores);
  return app;
}
