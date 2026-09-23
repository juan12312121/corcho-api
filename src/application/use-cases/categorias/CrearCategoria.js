import { UseCase } from '../../shared/UseCase.js';
import { Categoria } from '../../../domain/entities/Categoria.js';

/** Cualquier miembro puede agregar una categoría propia ("Mascotas", "Tanda", "Escuela"…). */
export class CrearCategoria extends UseCase {
  constructor({ acceso, categorias, eventos }) {
    super();
    this.acceso = acceso;
    this.categorias = categorias;
    this.eventos = eventos;
  }

  async ejecutar({ actor, tableroId, nombre, icono, color }) {
    await this.acceso.exigir(tableroId, actor.id);
    const categoria = await this.categorias.crear(Categoria.crear({ tableroId, nombre, icono, color, creadoPor: actor.id }));
    this.eventos.aTablero(tableroId, 'categoria:guardada', categoria);
    return categoria;
  }
}
