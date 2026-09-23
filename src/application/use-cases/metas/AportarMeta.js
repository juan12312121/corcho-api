import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';

/** Aportar a una meta (monto positivo) o sacar de ella (negativo, sin pasar de lo ahorrado). */
export class AportarMeta extends UseCase {
  constructor({ acceso, metas, eventos }) {
    super();
    this.acceso = acceso;
    this.metas = metas;
    this.eventos = eventos;
  }

  async ejecutar({ actor, tableroId, metaId, monto, fecha }) {
    await this.acceso.exigir(tableroId, actor.id);
    const meta = await this.metas.porId(metaId, tableroId);
    if (!meta) throw new NoEncontradoError('Meta no encontrada');
    const aportado = meta.aportar(monto);
    const guardada = await this.metas.agregarAporte(meta, { usuarioId: actor.id, monto: aportado, ...(fecha ? { fecha } : {}) });
    this.eventos.aTablero(tableroId, 'meta:actualizada', guardada);
    return guardada;
  }
}
