import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';
import { PermisoDenegadoError } from '../../../domain/shared/errors.js';
import { resumen } from './CrearNota.js';
import { validarCategoriaDeNota } from '../categorias/exigirCategoria.js';

/** Cambiar contenido o dinero de una nota. Solo quien la creó o un admin. */
export class EditarNota extends UseCase {
  constructor({ acceso, miembros, notas, categorias, liquidacion, avisos, bitacora }) {
    super();
    this.categorias = categorias;
    this.acceso = acceso;
    this.miembros = miembros;
    this.notas = notas;
    this.liquidacion = liquidacion;
    this.avisos = avisos;
    this.bitacora = bitacora;
  }

  async ejecutar({ actor, tableroId, notaId, ...cambios }) {
    const { tablero, miembro } = await this.acceso.exigir(tableroId, actor.id);
    const nota = await this.notas.porId(notaId, tableroId);
    if (!nota) throw new NoEncontradoError('Nota no encontrada');
    if (!nota.puedeEditarla(miembro)) throw new PermisoDenegadoError('Solo quien creó la nota o un admin puede cambiarla');
    await validarCategoriaDeNota(this.categorias, cambios.categoriaId, tableroId);

    const { tocaDinero } = nota.editar(cambios, { tablero, miembrosIds: await this.miembros.idsDe(tableroId) });
    if (tocaDinero) await this.liquidacion.aplicar(nota);
    const guardada = await this.notas.guardar(nota);

    this.avisos.publicar(tableroId, 'nota:actualizada', guardada, { cambiaBalance: tocaDinero && guardada.afectaBalance() });
    await this.bitacora.registrar(tableroId, actor.id, 'nota:actualizada', resumen(guardada));
    return guardada;
  }
}
