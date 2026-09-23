import { UseCase } from '../../shared/UseCase.js';
import { Tablero } from '../../../domain/entities/Tablero.js';
import { Miembro } from '../../../domain/entities/Miembro.js';
import { Categoria } from '../../../domain/entities/Categoria.js';

/** Crea un tablero personal o compartido y deja al creador como propietario. */
export class CrearTablero extends UseCase {
  constructor({ uow, miembros, bitacora }) {
    super();
    this.uow = uow;
    this.miembros = miembros;
    this.bitacora = bitacora;
  }

  async ejecutar({ actor, ...datos }) {
    const tablero = await this.uow.ejecutar(async (repos) => {
      const t = await repos.tableros.crear(Tablero.crear({ ...datos, propietarioId: actor.id }));
      await repos.miembros.crear(Miembro.propietario(t.id, actor.id));
      await repos.categorias.crearVarias(Categoria.baseDe(t.id));
      return t;
    });
    await this.bitacora.registrar(tablero.id, actor.id, 'tablero:creado', { nombre: tablero.nombre, tipo: tablero.tipo });
    return { ...tablero.toJSON(), miRol: 'propietario', miembros: await this.miembros.listarConUsuarios(tablero.id) };
  }
}
