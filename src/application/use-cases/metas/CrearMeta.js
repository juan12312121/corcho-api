import { UseCase } from '../../shared/UseCase.js';
import { Meta } from '../../../domain/entities/Meta.js';

/** Nueva meta de ahorro (personal o compartida: en la compartida cualquiera aporta). */
export class CrearMeta extends UseCase {
  constructor({ acceso, metas, eventos }) {
    super();
    this.acceso = acceso;
    this.metas = metas;
    this.eventos = eventos;
  }

  async ejecutar({ actor, tableroId, ...datos }) {
    await this.acceso.exigir(tableroId, actor.id);
    const meta = await this.metas.crear(Meta.crear(datos, { tableroId, autorId: actor.id }));
    this.eventos.aTablero(tableroId, 'meta:actualizada', meta);
    return meta;
  }
}
