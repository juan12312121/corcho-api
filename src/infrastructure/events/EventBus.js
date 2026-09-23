import { EventEmitter } from 'node:events';
import { EventPublisher } from '../../application/ports/EventPublisher.js';

/**
 * Implementación en memoria del puerto EventPublisher. La capa de tiempo real
 * (presentation/realtime) se suscribe a 'tablero' y 'usuario' y los reenvía por Socket.IO.
 */
export class EventBus extends EventPublisher {
  constructor() {
    super();
    this.emisor = new EventEmitter();
  }

  aTablero(tableroId, evento, datos, { excepto } = {}) {
    this.emisor.emit('tablero', { tableroId, evento, datos, excepto });
  }

  aUsuario(usuarioId, evento, datos) {
    this.emisor.emit('usuario', { usuarioId, evento, datos });
  }

  /** @param {'tablero'|'usuario'} canal */
  suscribir(canal, manejador) {
    this.emisor.on(canal, manejador);
  }
}
