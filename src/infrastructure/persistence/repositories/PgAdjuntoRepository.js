import { AdjuntoRepository } from '../../../domain/repositories/AdjuntoRepository.js';
import { Adjunto } from '../../../domain/entities/Adjunto.js';
import { AdjuntoModel } from '../models/AdjuntoModel.js';

const aEntidad = (fila) => (fila ? new Adjunto(fila) : null);

export class PgAdjuntoRepository extends AdjuntoRepository {
  constructor(db) {
    super();
    this.modelo = new AdjuntoModel(db);
  }

  async porId(id, tableroId) {
    return aEntidad(await this.modelo.buscarUno({ id, tableroId }));
  }

  async deNota(notaId) {
    return (await this.modelo.buscar({ notaId }, { orden: 'creadoEn' })).map(aEntidad);
  }

  async deTablero(tableroId) {
    return (await this.modelo.buscar({ tableroId })).map(aEntidad);
  }

  async crear(adjunto) {
    return aEntidad(await this.modelo.insertar(adjunto));
  }

  async borrar(id) {
    await this.modelo.borrar(id);
  }
}
