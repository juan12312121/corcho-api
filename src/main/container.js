/**
 * Raíz de composición: el ÚNICO lugar que conoce todas las capas.
 * Aquí se eligen las implementaciones (Postgres, bcrypt, JWT, bus en memoria)
 * de los puertos y se inyectan en los casos de uso con las fábricas.
 */
import { env } from '../infrastructure/config/env.js';
import { pool } from '../infrastructure/database/pool.js';
import { PgUnitOfWork } from '../infrastructure/database/PgUnitOfWork.js';
import { RepositoryFactory } from '../infrastructure/persistence/RepositoryFactory.js';
import { PgConsultasBalance } from '../infrastructure/persistence/PgConsultasBalance.js';
import { BcryptPasswordHasher } from '../infrastructure/security/BcryptPasswordHasher.js';
import { JwtTokenService } from '../infrastructure/security/JwtTokenService.js';
import { CryptoGeneradorCodigos } from '../infrastructure/security/CryptoGeneradorCodigos.js';
import { EventBus } from '../infrastructure/events/EventBus.js';
import { CloudinaryAlmacen } from '../infrastructure/storage/CloudinaryAlmacen.js';
import { N8nEnviadorCorreos } from '../infrastructure/mail/N8nEnviadorCorreos.js';
import { ConsolaEnviadorCorreos } from '../infrastructure/mail/ConsolaEnviadorCorreos.js';
import { CryptoGeneradorTokens } from '../infrastructure/security/CryptoGeneradorTokens.js';

import { AccesoTablero } from '../application/services/AccesoTablero.js';
import { Bitacora } from '../application/services/Bitacora.js';
import { LiquidacionDeNotas } from '../application/services/LiquidacionDeNotas.js';
import { AvisosDeTablero } from '../application/services/AvisosDeTablero.js';

import { autenticar, tokenIntegracion } from '../presentation/http/middlewares.js';
import { PresupuestoController } from '../presentation/http/controllers/PresupuestoController.js';
import { ReporteController } from '../presentation/http/controllers/ReporteController.js';
import { IntegracionController } from '../presentation/http/controllers/IntegracionController.js';
import { PresupuestoRouter } from '../presentation/http/routers/PresupuestoRouter.js';
import { IntegracionRouter } from '../presentation/http/routers/IntegracionRouter.js';
import { IngresoController } from '../presentation/http/controllers/IngresoController.js';
import { IngresoRouter } from '../presentation/http/routers/IngresoRouter.js';
import { MetaController } from '../presentation/http/controllers/MetaController.js';
import { MetaRouter } from '../presentation/http/routers/MetaRouter.js';
import { AuthController } from '../presentation/http/controllers/AuthController.js';
import { TableroController } from '../presentation/http/controllers/TableroController.js';
import { MiembroController } from '../presentation/http/controllers/MiembroController.js';
import { InvitacionController } from '../presentation/http/controllers/InvitacionController.js';
import { NotaController } from '../presentation/http/controllers/NotaController.js';
import { PagoController } from '../presentation/http/controllers/PagoController.js';
import { BalanceController } from '../presentation/http/controllers/BalanceController.js';
import { ActividadController } from '../presentation/http/controllers/ActividadController.js';
import { CategoriaController } from '../presentation/http/controllers/CategoriaController.js';
import { AuthRouter } from '../presentation/http/routers/AuthRouter.js';
import { TableroRouter } from '../presentation/http/routers/TableroRouter.js';
import { MiembroRouter } from '../presentation/http/routers/MiembroRouter.js';
import { InvitacionRouter, InvitacionTableroRouter } from '../presentation/http/routers/InvitacionRouter.js';
import { NotaRouter } from '../presentation/http/routers/NotaRouter.js';
import { PagoRouter } from '../presentation/http/routers/PagoRouter.js';
import { LecturaRouter } from '../presentation/http/routers/LecturaRouter.js';
import { CategoriaRouter } from '../presentation/http/routers/CategoriaRouter.js';

import { UseCaseFactory } from './factories/UseCaseFactory.js';
import { HttpModuleFactory } from './factories/HttpModuleFactory.js';

export function crearContenedor() {
  // ---------- infraestructura (implementaciones de los puertos) ----------
  const repos = RepositoryFactory.crear(pool);
  const eventos = new EventBus();
  const tokens = new JwtTokenService({ secreto: env.JWT_SECRET, expira: env.JWT_EXPIRA });
  const puertos = {
    uow: new PgUnitOfWork(pool),
    consultasBalance: new PgConsultasBalance(pool),
    hasher: new BcryptPasswordHasher(),
    codigos: new CryptoGeneradorCodigos(),
    tokens,
    eventos,
    diasPorDefecto: env.INVITACION_DIAS,
    tokensSeguros: new CryptoGeneradorTokens(),
    almacen: new CloudinaryAlmacen({
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
      apiSecret: env.CLOUDINARY_API_SECRET,
    }),
    correos: env.N8N_CORREOS_URL
      ? new N8nEnviadorCorreos({ url: env.N8N_CORREOS_URL, token: env.N8N_CORREOS_TOKEN })
      : new ConsolaEnviadorCorreos(),
    urlFrontend: env.URL_FRONTEND,
  };

  // ---------- aplicación ----------
  const servicios = {
    acceso: new AccesoTablero(repos),
    bitacora: new Bitacora({ ...repos, eventos }),
    liquidacion: new LiquidacionDeNotas(repos),
    avisos: new AvisosDeTablero({ ...repos, eventos }),
  };
  const casos = UseCaseFactory.crearTodos({ ...repos, ...puertos, ...servicios });

  // ---------- presentación ----------
  const conSesion = autenticar(tokens);
  const privado = { middlewares: [conSesion] };
  const modulo = (Controller, Router, opciones = privado) => HttpModuleFactory.crear(Controller, Router, casos, opciones);

  const rutas = [
    ['/auth', modulo(AuthController, AuthRouter, { conSesion })],
    ['/invitaciones', modulo(InvitacionController, InvitacionRouter)],
    ['/tableros/:tableroId/miembros', modulo(MiembroController, MiembroRouter)],
    ['/tableros/:tableroId/invitaciones', modulo(InvitacionController, InvitacionTableroRouter)],
    ['/tableros/:tableroId/notas', modulo(NotaController, NotaRouter)],
    ['/tableros/:tableroId/categorias', modulo(CategoriaController, CategoriaRouter)],
    ['/tableros/:tableroId/presupuestos', modulo(PresupuestoController, PresupuestoRouter)],
    ['/tableros/:tableroId/ingresos', modulo(IngresoController, IngresoRouter)],
    ['/tableros/:tableroId/metas', modulo(MetaController, MetaRouter)],
    ['/tableros/:tableroId/reportes', modulo(ReporteController, LecturaRouter, { ...privado, accion: 'obtener' })],
    ['/integraciones', modulo(IntegracionController, IntegracionRouter, { middlewares: [tokenIntegracion(env.INTEGRACION_TOKEN)] })],
    ['/tableros/:tableroId/pagos', modulo(PagoController, PagoRouter)],
    ['/tableros/:tableroId/balance', modulo(BalanceController, LecturaRouter, { ...privado, accion: 'obtener' })],
    ['/tableros/:tableroId/actividad', modulo(ActividadController, LecturaRouter, { ...privado, accion: 'listar' })],
    ['/tableros', modulo(TableroController, TableroRouter)],
  ];

  return {
    rutas,
    tiempoReal: { tokens, eventos, verificarAcceso: casos.verificarAccesoEnVivo, corsOrigen: env.CORS_ORIGEN },
    config: env,
    cerrar: () => pool.end(),
  };
}
