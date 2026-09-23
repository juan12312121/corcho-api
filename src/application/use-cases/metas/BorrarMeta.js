import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';

export class BorrarMeta extends UseCase {
  constructor({ acceso, metas, eventos }) {
    super();
    this.acceso = acceso;
    this.metas = metas;
    this.eventos = eventos;
  }

  async ejecutar({ actor, tableroId, metaId }) {
    const { miembro } = await this.acceso.exigir(tableroId, actor.id);
    const meta = await this.metas.porId(metaId, tableroId);
    if (!meta) throw new NoEncontradoError('Meta no encontrada');
    meta.exigirPuedeBorrar(miembro);
    await this.metas.borrar(metaId);
    this.eventos.aTablero(tableroId, 'meta:borrada', { id: metaId });
  }
}
