import { UseCase } from '../../shared/UseCase.js';

/** Limpia el corcho: manda al archivo todas las notas que ya no tienen nada pendiente. */
export class ArchivarSaldadas extends UseCase {
  constructor({ acceso, notas, avisos }) {
    super();
    this.acceso = acceso;
    this.notas = notas;
    this.avisos = avisos;
  }

  async ejecutar({ actor, tableroId }) {
    await this.acceso.exigir(tableroId, actor.id);
    const visibles = await this.notas.listar(tableroId, { filtros: { archivada: false }, orden: 'z', limite: 2000 });
    const saldadas = visibles.filter((n) => n.puedeArchivarse());
    for (const nota of saldadas) {
      nota.archivar();
      this.avisos.publicar(tableroId, 'nota:actualizada', await this.notas.guardar(nota));
    }
    return { archivadas: saldadas.length };
  }
}
