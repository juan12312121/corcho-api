import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';

/**
 * Soltar una nota en el corcho: cualquier miembro puede acomodarlas.
 * No va a la bitácora (sería ruido) y no le llega el eco a quien la movió (`conexionId`).
 */
export class MoverNota extends UseCase {
  constructor({ acceso, notas, avisos }) {
    super();
    this.acceso = acceso;
    this.notas = notas;
    this.avisos = avisos;
  }

  async ejecutar({ actor, tableroId, notaId, posX, posY, rotacion, alFrente, conexionId }) {
    await this.acceso.exigir(tableroId, actor.id);
    const nota = await this.notas.porId(notaId, tableroId);
    if (!nota) throw new NoEncontradoError('Nota no encontrada');

    nota.mover({ posX, posY, rotacion }, alFrente ? await this.notas.siguienteZ(tableroId) : undefined);
    const guardada = await this.notas.guardarPosicion(nota);
    const posicion = { id: guardada.id, posX: guardada.posX, posY: guardada.posY, rotacion: guardada.rotacion, z: guardada.z };
    this.avisos.publicar(tableroId, 'nota:movida', posicion, { excepto: conexionId });
    return posicion;
  }
}
