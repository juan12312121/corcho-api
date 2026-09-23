import { IngresoRepository } from '../../../domain/repositories/IngresoRepository.js';
import { Ingreso } from '../../../domain/entities/Ingreso.js';
import { IngresoModel } from '../models/IngresoModel.js';

const aEntidad = (fila) => (fila ? new Ingreso(fila) : null);

export class PgIngresoRepository extends IngresoRepository {
  constructor(db) {
    super();
    this.modelo = new IngresoModel(db);
  }

  async listar(tableroId) {
    return (await this.modelo.buscar({ tableroId }, { limite: 1000 })).map(aEntidad);
  }

  async porId(id, tableroId) {
    return aEntidad(await this.modelo.buscarUno({ id, tableroId }));
  }

  async crear(ingreso) {
    return aEntidad(await this.modelo.insertar(ingreso));
  }

  async borrar(id) {
    await this.modelo.borrar(id);
  }
}
