import { UseCase } from '../../shared/UseCase.js';

export class ObtenerTablero extends UseCase {
  constructor({ acceso, miembros }) {
    super();
    this.acceso = acceso;
    this.miembros = miembros;
  }

  async ejecutar({ actor, tableroId }) {
    const { tablero, miembro } = await this.acceso.exigir(tableroId, actor.id);
    return { ...tablero.toJSON(), miRol: miembro.rol, miembros: await this.miembros.listarConUsuarios(tableroId) };
  }
}
