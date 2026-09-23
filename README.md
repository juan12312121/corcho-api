# Corcho — tablero de deudas (backend)

Un tablero de corcho donde cada nota con su pin es un gasto, un recibo (luz, internet…), un préstamo o un recordatorio.

- **Tablero personal**: solo tú. Tus gastos del mes por categoría, recibos por pagar y vencidos, y deudas con gente de fuera de la app ("le debo $500 a Juan") con abonos.
- **Tablero compartido**: invitas a familia o amigos. Los gastos se reparten (igual, montos, porcentaje o proporción), se ve quién le debe a quién y la forma más corta de quedar a mano. Todo en tiempo real.

Al registrarte se crea solo tu tablero personal "Mis finanzas". Un personal se puede volver compartido; un compartido vuelve a personal solo cuando ya no queda nadie más.

**Stack:** Express 4 · JavaScript (ESM) · Clean Architecture · Postgres en Supabase (`pg`) · Socket.IO · zod · JWT.

## Arquitectura

Las dependencias apuntan solo hacia adentro: `presentation → application → domain`. `infrastructure` implementa los puertos, y `main` es el único que conoce todo.

```
src/
  domain/                      ← reglas del negocio; sin Express, sin SQL, sin librerías
    entities/                    Usuario, Tablero, Miembro, Invitacion, Nota, Pago, Categoria, Actividad (BaseEntity)
    services/                    Reparto, Balance, Recurrencia, PlanMeses, ResumenPersonal, ResumenPlanes (funciones puras)
    repositories/                contratos (puertos) que la infraestructura implementa
    shared/                      errores del dominio, Dinero (centavos), Fechas
  application/                 ← qué puede hacer el sistema
    use-cases/<módulo>/          un caso de uso por archivo (CrearNota, PagarNota, AceptarInvitacion…)
    services/                    AccesoTablero, Bitacora, LiquidacionDeNotas, AvisosDeTablero
    ports/                       UnitOfWork, EventPublisher, TokenService, PasswordHasher, GeneradorCodigos, ConsultasBalance
    shared/                      UseCase (base), Pagina, errores de aplicación
  infrastructure/              ← detalles intercambiables
    persistence/BaseModel.js     mapeador genérico de tabla (SQL parametrizado, camelCase ⇄ snake_case)
    persistence/models/          un modelo por tabla
    persistence/repositories/    Pg*Repository: implementan los contratos del dominio
    persistence/RepositoryFactory.js
    database/                    pool, PgUnitOfWork (transacciones), migraciones
    security/                    bcrypt, JWT, códigos de invitación
    events/EventBus.js           implementa EventPublisher
    config/env.js
  presentation/                ← cómo se entra
    http/BaseController.js       una línea por acción: this.accion('crearNota', { body, status })
    http/BaseRouter.js           rutas() + crud(':notaId')
    http/controllers · routers · esquemas (zod) · errores.js (error → código HTTP)
    realtime/SocketServer.js     Socket.IO: cuarto por tablero y por usuario, presencia, arrastre en vivo
  main/                        ← composición
    container.js                 elige implementaciones e inyecta
    factories/UseCaseFactory.js · HttpModuleFactory.js
    server.js
tests/
  domain/                      entidades y reglas puras
  application/                 casos de uso con dobles en memoria (sin BD)
```

**Errores → HTTP** (`presentation/http/errores.js`): datos inválidos 400 · sin sesión 401 · `PermisoDenegadoError` 403 · `NoEncontradoError` 404 · `ConflictoError`/`EstadoInvalidoError` 409 · `NoVigenteError` 410 · `ReglaDeNegocioError` 422.

## Correr

```bash
cp .env.example .env    # llena DB_PASSWORD y JWT_SECRET
npm install
npm run db:migrate      # idempotente
npm test                # dominio + casos de uso, sin BD
npm run dev             # http://localhost:3200
npm run e2e             # con el server arriba: 15 etapas de punta a punta; borra lo que crea
```

> Supabase: usa el **Session pooler** (`aws-0-us-east-2.pooler.supabase.com`, usuario `postgres.<ref>`); el host directo es solo IPv6.
> Todas las tablas tienen RLS activo **sin políticas**: la API REST pública de Supabase no puede leerlas; solo este backend entra.

## API (JSON en camelCase)

Respuesta: `{ ok, data, meta? }` o `{ ok: false, error: { codigo, mensaje, detalles } }`. 🔒 = `Authorization: Bearer <token>`.

| Método | Ruta | Quién | Qué |
|---|---|---|---|
| POST | `/auth/registro` · `/auth/login` | todos | `{ token, usuario }` (el registro crea "Mis finanzas") |
| GET/PATCH | `/auth/yo` 🔒 | yo | perfil; `{ password, passwordActual }` para cambiarla |
| GET | `/tableros?tipo=&archivado=` 🔒 | yo | personales primero; `miRol, integrantes, notasAbiertas, porPagar, miNeto` |
| POST | `/tableros` 🔒 | yo | `{ nombre, tipo: 'personal'|'compartido', descripcion?, moneda?, fondo? }` |
| GET/PATCH/DELETE | `/tableros/:tableroId` 🔒 | miembro / admin / propietario | |
| PATCH | `/tableros/:tableroId/tipo` 🔒 | propietario | `{ tipo }` personal ⇄ compartido |
| GET | `/tableros/:tableroId/miembros` 🔒 | miembro | |
| PATCH/DELETE | `/tableros/:tableroId/miembros/:usuarioId` 🔒 | admin (apodo: yo) | `{ rol, apodo }` · sacar (409 con saldo) |
| POST | `/tableros/:tableroId/miembros/salir` · `/:usuarioId/transferir` 🔒 | yo / propietario | |
| GET/POST/DELETE | `/tableros/:tableroId/invitaciones[/:invitacionId]` 🔒 | admin, solo compartidos | `{ email?, rol?, usosMax?, dias? }` |
| GET | `/invitaciones/pendientes` · `/invitaciones/:codigo` 🔒 | yo | bandeja · vista previa |
| POST | `/invitaciones/:codigo/aceptar` · `/rechazar` 🔒 | invitado | |
| GET/POST | `/tableros/:tableroId/notas` 🔒 | miembro | filtros `tipo, estado, color, categoriaId, planId, pagadoPor, creadoPor, orden` |
| GET/PATCH/DELETE | `/tableros/:tableroId/notas/:notaId` 🔒 | miembro / autor o admin | |
| PATCH | `/tableros/:tableroId/notas/:notaId/posicion` 🔒 | miembro | `{ posX, posY, rotacion?, alFrente? }` + header `X-Socket-Id` |
| POST | `/tableros/:tableroId/notas/:notaId/pagar` 🔒 | miembro | recibo pagado (recurrente → clava el siguiente) o recordatorio hecho |
| POST | `/tableros/:tableroId/notas/:notaId/abonos` 🔒 | autor | `{ monto }` abono a deuda externa |
| GET/POST/PATCH/DELETE | `/tableros/:tableroId/categorias[/:categoriaId]` 🔒 | miembro (editar/quitar: quien la creó o admin) | categorías personalizadas `{ nombre, icono, color }`; cada tablero nace con 8 de base |
| GET/POST/DELETE | `/tableros/:tableroId/pagos[/:pagoId]` 🔒 | miembro, solo compartidos | |
| POST | `/tableros/:tableroId/pagos/:pagoId/confirmar` · `/rechazar` 🔒 | quien recibe | |
| GET | `/tableros/:tableroId/balance` 🔒 | miembro | personal: `gastadoMes, porCategoria, porPagar, vencidas, proximas, debo, meDeben` · compartido: `totales, netos, entrePares, sugerencias, mio` |
| GET | `/tableros/:tableroId/actividad` 🔒 | miembro | bitácora paginada |

**Nota en tablero compartido:**
```json
{ "tipo": "servicio", "titulo": "Luz", "monto": 900, "modoReparto": "proporcion",
  "participantes": [{ "usuarioId": "…", "proporcion": 2 }, { "usuarioId": "…", "proporcion": 1 }],
  "venceEn": "2026-09-30", "recurrencia": "mensual", "color": "azul", "posX": 120, "posY": 80 }
```
Sin `participantes` se reparte igual entre todos; un servicio sin `pagadoPor` nace `por_pagar`.

**A meses** (`plazoMeses` de 2 a 60):
- *Compra a meses* (gasto/servicio): `monto` es el TOTAL. Se clava la mensualidad 1 de N (por pagar); al pagarla se clava sola la siguiente hasta la última. Los centavos que sobran van en las primeras mensualidades. Las notas comparten `planId` y traen `numeroCuota`, `montoPlan`.
- *Deuda a meses* (préstamo): una sola nota; se va pagando con pagos entre miembros (o abonos si es alguien de fuera) y `abonado` lleva lo pagado.
- `GET /balance` trae `planes`: total, mensualidad, pagadas de N, pagado, restante y próxima fecha.

```json
{ "titulo": "Tele", "monto": 12000, "plazoMeses": 12, "venceEn": "2026-10-05", "categoriaId": "…" }
```

**Deuda externa en tablero personal:**
```json
{ "tipo": "prestamo", "titulo": "Préstamo de Juan", "monto": 500, "contraparte": "Juan", "direccion": "debo" }
```

## Tiempo real (Socket.IO)

```js
const s = io(API, { auth: { token } });
s.emit('tablero:unirse', tableroId, (r) => r.presentes);
s.emit('nota:arrastrando', { tableroId, notaId, posX, posY });   // mientras arrastra
// al soltar: PATCH …/notas/:notaId/posicion con header X-Socket-Id: s.id
```

| Cuarto | Eventos |
|---|---|
| tablero | `categoria:guardada` `categoria:borrada` · `nota:creada` `nota:actualizada` `nota:movida` `nota:borrada` `nota:arrastrando` · `pago:creado` `pago:actualizado` `pago:borrado` · `balance:cambio` · `miembro:entro` `miembro:actualizado` `miembro:salio` · `tablero:actualizado` `tablero:borrado` · `actividad:nueva` · `presencia` |
| usuario | `invitacion:nueva` · `pago:por_confirmar` · `tablero:expulsado` |

## Despliegue (Render)

1. En Render: **New → Blueprint** y elige este repo (usa `render.yaml`).
2. Llena las variables que pide: `DB_USER`, `DB_PASSWORD` (Supabase → Connect → Session pooler), `CORS_ORIGEN` y `URL_FRONTEND` (la URL de Vercel), las de Cloudinary y `N8N_CORREOS_URL` + `N8N_CORREOS_TOKEN` (el flujo de n8n que manda los correos).
3. `JWT_SECRET` e `INTEGRACION_TOKEN` se generan solos. Las migraciones se corren una vez con `npm run db:migrate` (ya están aplicadas en Supabase).

El plan gratis se duerme tras 15 min sin uso: la primera petición tarda ~1 min en despertarlo.
