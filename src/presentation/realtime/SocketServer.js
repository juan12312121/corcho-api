import { Server } from 'socket.io';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const cuartoTablero = (id) => `tablero:${id}`;
const cuartoUsuario = (id) => `usuario:${id}`;

/**
 * Socket.IO para el corcho en vivo.
 *
 *   const s = io(API, { auth: { token } })
 *   s.emit('tablero:unirse', tableroId, (r) => r.presentes)
 *   s.emit('nota:arrastrando', { tableroId, notaId, posX, posY })   // mientras arrastra (no se guarda)
 *   // al soltar: PATCH /tableros/:id/notas/:notaId/posicion con header X-Socket-Id: s.id
 *
 * Cada usuario entra además a "usuario:<id>" para avisos personales.
 */
export class SocketServer {
  /**
   * @param {import('node:http').Server} http
   * @param {{ tokens, verificarAcceso, eventos: import('../../infrastructure/events/EventBus.js').EventBus, corsOrigen }} deps
   */
  constructor(http, { tokens, verificarAcceso, eventos, corsOrigen }) {
    this.tokens = tokens;
    this.verificarAcceso = verificarAcceso;
    /** tableroId → (usuarioId → nº de pestañas conectadas) */
    this.presencia = new Map();
    this.io = new Server(http, { cors: { origin: corsOrigen } });
    this.io.use((socket, next) => this.#autenticar(socket, next));
    this.io.on('connection', (socket) => this.#conectar(socket));
    eventos.suscribir('tablero', (e) => this.#reenviarATablero(e));
    eventos.suscribir('usuario', (e) => this.#reenviarAUsuario(e));
  }

  #autenticar(socket, next) {
    try {
      socket.data.actor = this.tokens.verificar(String(socket.handshake.auth?.token ?? ''));
      next();
    } catch (e) {
      next(e);
    }
  }

  #conectar(socket) {
    const actor = socket.data.actor;
    socket.join(cuartoUsuario(actor.id));

    socket.on('tablero:unirse', async (tableroId, ack = () => {}) => {
      try {
        if (!UUID.test(String(tableroId)) || !(await this.verificarAcceso.ejecutar({ actor, tableroId })))
          return ack({ ok: false, error: 'No estás en ese tablero' });
        if (!socket.rooms.has(cuartoTablero(tableroId))) {
          await socket.join(cuartoTablero(tableroId));
          this.#sumarPresencia(tableroId, actor.id, +1);
        }
        ack({ ok: true, presentes: this.#presentes(tableroId) });
      } catch (e) {
        console.error(e);
        ack({ ok: false, error: 'Error al unirse' });
      }
    });

    socket.on('tablero:salir', (tableroId) => this.#salir(socket, tableroId));

    // Eco en vivo del arrastre para los demás; lo definitivo va por REST al soltar
    socket.on('nota:arrastrando', ({ tableroId, notaId, posX, posY } = {}) => {
      if (!socket.rooms.has(cuartoTablero(tableroId)) || !Number.isFinite(posX) || !Number.isFinite(posY)) return;
      socket.to(cuartoTablero(tableroId)).volatile.emit('nota:arrastrando', { notaId, posX, posY, usuarioId: actor.id });
    });

    socket.on('disconnecting', () => {
      for (const cuarto of socket.rooms) {
        if (cuarto.startsWith('tablero:')) this.#sumarPresencia(cuarto.slice('tablero:'.length), actor.id, -1);
      }
    });
  }

  #salir(socket, tableroId) {
    if (!socket.rooms.has(cuartoTablero(tableroId))) return;
    socket.leave(cuartoTablero(tableroId));
    this.#sumarPresencia(tableroId, socket.data.actor.id, -1);
  }

  #sumarPresencia(tableroId, usuarioId, delta) {
    const tablero = this.presencia.get(tableroId) ?? new Map();
    const pestañas = (tablero.get(usuarioId) ?? 0) + delta;
    if (pestañas > 0) tablero.set(usuarioId, pestañas);
    else tablero.delete(usuarioId);
    if (tablero.size) this.presencia.set(tableroId, tablero);
    else this.presencia.delete(tableroId);
    this.io.to(cuartoTablero(tableroId)).emit('presencia', { tableroId, presentes: this.#presentes(tableroId) });
  }

  #presentes(tableroId) {
    return [...(this.presencia.get(tableroId)?.keys() ?? [])];
  }

  #reenviarATablero({ tableroId, evento, datos, excepto }) {
    const destino = this.io.to(cuartoTablero(tableroId));
    (excepto ? destino.except(excepto) : destino).emit(evento, datos);
  }

  async #reenviarAUsuario({ usuarioId, evento, datos }) {
    this.io.to(cuartoUsuario(usuarioId)).emit(evento, datos);
    // Si lo sacaron (o se salió), sus pestañas dejan de escuchar ese tablero
    if (evento !== 'tablero:expulsado') return;
    for (const s of await this.io.in(cuartoUsuario(usuarioId)).fetchSockets()) {
      if (!s.rooms.has(cuartoTablero(datos.tableroId))) continue;
      s.leave(cuartoTablero(datos.tableroId));
      this.#sumarPresencia(datos.tableroId, usuarioId, -1);
    }
  }
}
