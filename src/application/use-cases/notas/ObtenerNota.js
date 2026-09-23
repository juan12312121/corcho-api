import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';

export class ObtenerNota extends UseCase {
  constructor({ acceso, notas }) {
    super();
    this.acceso = acceso;
    this.notas = notas;
  }

  async ejecutar({ actor, tableroId, notaId }) {
    await this.acceso.exigir(tableroId, actor.id);
    const nota = await this.notas.porId(notaId, tableroId);
    if (!nota) throw new NoEncontradoError('Nota no encontrada');
    return nota;
  }
}
