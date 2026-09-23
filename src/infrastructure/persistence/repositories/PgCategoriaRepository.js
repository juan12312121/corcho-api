import { CategoriaRepository } from '../../../domain/repositories/CategoriaRepository.js';
import { Categoria } from '../../../domain/entities/Categoria.js';
import { CategoriaModel } from '../models/CategoriaModel.js';

const aEntidad = (fila) => (fila ? new Categoria(fila) : null);

export class PgCategoriaRepository extends CategoriaRepository {
  constructor(db) {
    super();
    this.modelo = new CategoriaModel(db);
  }

  async porId(id, tableroId) {
    return aEntidad(await this.modelo.buscarUno({ id, tableroId }));
  }

  async listar(tableroId) {
    return (await this.modelo.buscar({ tableroId })).map(aEntidad);
  }

  async crear(categoria) {
    return aEntidad(await this.modelo.insertar(categoria));
  }

  async crearVarias(categorias) {
    if (!categorias.length) return [];
    const filas = await this.modelo.filas(
      `INSERT INTO categorias (tablero_id, nombre, icono, color, creado_por)
       SELECT * FROM unnest($1::uuid[], $2::text[], $3::text[], $4::text[], $5::uuid[])
       ON CONFLICT DO NOTHING
       RETURNING ${this.modelo.select()}`,
      [
        categorias.map((c) => c.tableroId),
        categorias.map((c) => c.nombre),
        categorias.map((c) => c.icono),
        categorias.map((c) => c.color),
        categorias.map((c) => c.creadoPor ?? null),
      ],
    );
    return filas.map(aEntidad);
  }

  async guardar(categoria) {
    return aEntidad(await this.modelo.actualizar(categoria.id, categoria));
  }

  async borrar(id) {
    await this.modelo.borrar(id);
  }
}
