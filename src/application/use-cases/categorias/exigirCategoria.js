import { NoEncontradoError } from '../../shared/errors.js';
import { ReglaDeNegocioError } from '../../../domain/shared/errors.js';

/** La categoría debe existir y ser de ESTE tablero. */
export async function exigirCategoria(categorias, categoriaId, tableroId) {
  const categoria = await categorias.porId(categoriaId, tableroId);
  if (!categoria) throw new NoEncontradoError('Categoría no encontrada');
  return categoria;
}

/** Para notas: si mandan categoría, que sea del tablero (null = sin categoría). */
export async function validarCategoriaDeNota(categorias, categoriaId, tableroId) {
  if (!categoriaId) return;
  if (!(await categorias.porId(categoriaId, tableroId)))
    throw new ReglaDeNegocioError('CATEGORIA_INVALIDA', 'Esa categoría no es de este tablero');
}
