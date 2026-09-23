/**
 * Avisos en vivo de lo que cambia en un tablero. Si el cambio mueve dinero entre
 * miembros, también avisa "balance:cambio" para que el panel de balance se refresque.
 */
export class AvisosDeTablero {
  constructor({ eventos, tableros }) {
    this.eventos = eventos;
    this.tableros = tableros;
  }

  publicar(tableroId, evento, datos, { cambiaBalance = false, excepto } = {}) {
    this.eventos.aTablero(tableroId, evento, datos, { excepto });
    if (cambiaBalance) this.eventos.aTablero(tableroId, 'balance:cambio', { tableroId });
    void this.tableros.tocar(tableroId).catch(() => {});
  }
}
