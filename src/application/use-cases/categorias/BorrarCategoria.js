import { UseCase } from '../../shared/UseCase.js';
import { PermisoDenegadoError } from '../../../domain/shared/errors.js';
import { exigirCategoria } from './exigirCategoria.js';

/** Las notas que la usaban se quedan "sin categoría" (no se borra ninguna nota). */
export class BorrarCategoria extends UseCase {
  constructor({ acceso, categorias, eventos }) {
    super();
    this.acceso = acceso;
    this.categorias = categorias;
    this.eventos = eventos;
  }

  async ejecutar({ actor, tableroId, categoriaId }) {
    const { miembro } = await this.acceso.exigir(tableroId, actor.id);
    const categoria = await exigirCategoria(this.categorias, categoriaId, tableroId);
    if (!categoria.puedeModificarla(miembro)) throw new PermisoDenegadoError('Solo quien creó la categoría o un admin puede quitarla');
    await this.categorias.borrar(categoriaId);
    this.eventos.aTablero(tableroId, 'categoria:borrada', { id: categoriaId });
  }
}
