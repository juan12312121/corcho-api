/**
 * Puerto: avisos en tiempo real. Los casos de uso publican; quién los entrega
 * (Socket.IO hoy) es asunto de la infraestructura.
 */
export class EventPublisher {
  /** A todos los que tienen abierto el tablero. `excepto`: id de conexión que no debe recibir su propio eco. */
  aTablero(_tableroId, _evento, _datos, _opciones = {}) {
    throw new Error('EventPublisher.aTablero() no está implementado');
  }

  /** A todas las pestañas de un usuario (invitaciones, pagos por confirmar...). */
  aUsuario(_usuarioId, _evento, _datos) {
    throw new Error('EventPublisher.aUsuario() no está implementado');
  }
}
