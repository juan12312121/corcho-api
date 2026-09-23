import { UseCase } from '../../shared/UseCase.js';
import { PermisoDenegadoError } from '../../../domain/shared/errors.js';
import { exigirCategoria } from './exigirCategoria.js';

export class EditarCategoria extends UseCase {
  constructor({ acceso, categorias, eventos }) {
    super();
    this.acceso = acceso;
    this.categorias = categorias;
    this.eventos = eventos;
  }

  async ejecutar({ actor, tableroId, categoriaId, ...cambios }) {
    const { miembro } = await this.acceso.exigir(tableroId, actor.id);
    const categoria = await exigirCategoria(this.categorias, categoriaId, tableroId);
    if (!categoria.puedeModificarla(miembro)) throw new PermisoDenegadoError('Solo quien creó la categoría o un admin puede cambiarla');
    categoria.cambiar(cambios);
    const guardada = await this.categorias.guardar(categoria);
    this.eventos.aTablero(tableroId, 'categoria:guardada', guardada);
    return guardada;
  }
}
