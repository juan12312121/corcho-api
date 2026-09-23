import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';

/** Quita la foto de la nota y la borra de Cloudinary. */
export class BorrarAdjunto extends UseCase {
  constructor({ acceso, notas, adjuntos, almacen, avisos }) {
    super();
    this.acceso = acceso;
    this.notas = notas;
    this.adjuntos = adjuntos;
    this.almacen = almacen;
    this.avisos = avisos;
  }

  async ejecutar({ actor, tableroId, notaId, adjuntoId }) {
    const { miembro } = await this.acceso.exigir(tableroId, actor.id);
    const adjunto = await this.adjuntos.porId(adjuntoId, tableroId);
    if (!adjunto || adjunto.notaId !== notaId) throw new NoEncontradoError('Foto no encontrada');
    adjunto.exigirPuedeBorrar(miembro);

    await this.adjuntos.borrar(adjuntoId);
    await borrarArchivos(this.almacen, [adjunto]);
    this.avisos.publicar(tableroId, 'nota:actualizada', await this.notas.porId(notaId, tableroId));
  }
}

/** Borra de Cloudinary sin tumbar la operación si alguno falla (quedaría huérfano, no roto). */
export async function borrarArchivos(almacen, adjuntos) {
  if (!almacen.estaConfigurado()) return;
  const resultados = await Promise.allSettled(adjuntos.map((a) => almacen.borrar(a.publicId)));
  for (const r of resultados) if (r.status === 'rejected') console.error('No se pudo borrar de Cloudinary:', r.reason?.message);
}
