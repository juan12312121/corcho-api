/**
 * Marca qué partes de una nota ya están cubiertas por pagos confirmados.
 * Se usa cuando se confirma/anula un pago ligado a la nota o cuando cambia su dinero.
 */
export class LiquidacionDeNotas {
  constructor({ notas, pagos }) {
    this.notas = notas;
    this.pagos = pagos;
  }

  /** Aplica los pagos a la nota en memoria (no guarda). */
  async aplicar(nota) {
    if (nota.afectaBalance()) nota.aplicarPagos(await this.pagos.pagadoPorUsuarioEnNota(nota.id, nota.pagadoPor));
    return nota;
  }

  /** Carga, aplica y guarda. @returns {Promise<Nota|null>} */
  async recalcularPorId(notaId, tableroId) {
    const nota = await this.notas.porId(notaId, tableroId);
    if (!nota?.afectaBalance()) return nota;
    return this.notas.guardar(await this.aplicar(nota));
  }
}
