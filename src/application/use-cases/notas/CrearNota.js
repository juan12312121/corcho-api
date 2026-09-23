import { UseCase } from '../../shared/UseCase.js';
import { Nota } from '../../../domain/entities/Nota.js';
import { validarCategoriaDeNota } from '../categorias/exigirCategoria.js';

/** Clavar una nota nueva en el corcho. Las reglas por tipo de tablero viven en Nota.crear. */
export class CrearNota extends UseCase {
  constructor({ acceso, miembros, notas, categorias, avisos, bitacora }) {
    super();
    this.categorias = categorias;
    this.acceso = acceso;
    this.miembros = miembros;
    this.notas = notas;
    this.avisos = avisos;
    this.bitacora = bitacora;
  }

  async ejecutar({ actor, tableroId, ...datos }) {
    const { tablero } = await this.acceso.exigir(tableroId, actor.id);
    await validarCategoriaDeNota(this.categorias, datos.categoriaId, tableroId);
    const [miembrosIds, z] = await Promise.all([this.miembros.idsDe(tableroId), this.notas.siguienteZ(tableroId)]);
    const nota = await this.notas.crear(Nota.crear(datos, { tablero, autorId: actor.id, miembrosIds, z }));

    this.avisos.publicar(tableroId, 'nota:creada', nota, { cambiaBalance: nota.afectaBalance() });
    await this.bitacora.registrar(tableroId, actor.id, 'nota:creada', resumen(nota));
    return nota;
  }
}

export const resumen = (nota) => ({ notaId: nota.id, titulo: nota.titulo, tipo: nota.tipo, monto: nota.monto });
