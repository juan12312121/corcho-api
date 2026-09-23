import { UseCase } from '../../shared/UseCase.js';
import { NoEncontradoError } from '../../shared/errors.js';
import { PermisoDenegadoError } from '../../../domain/shared/errors.js';

/** Cambiar rol (admins) o apodo (cada quien el suyo; admins el de cualquiera). */
export class ActualizarMiembro extends UseCase {
  constructor({ acceso, miembros, eventos }) {
    super();
    this.acceso = acceso;
    this.miembros = miembros;
    this.eventos = eventos;
  }

  async ejecutar({ actor, tableroId, usuarioId, rol, apodo }) {
    const { miembro: yo } = await this.acceso.exigir(tableroId, actor.id);
    const objetivo = await this.miembros.de(tableroId, usuarioId);
    if (!objetivo) throw new NoEncontradoError('Esa persona no está en el tablero');

    if (rol !== undefined) {
      if (!yo.puedeCambiarRolDe(objetivo)) throw new PermisoDenegadoError('Solo admins cambian roles, y el del propietario no se cambia');
      objetivo.asignarRol(rol);
    }
    if (apodo !== undefined) {
      if (!yo.esElMismoQue(objetivo) && !yo.tieneRango('admin')) throw new PermisoDenegadoError('Solo puedes cambiar tu propio apodo');
      objetivo.ponerApodo(apodo);
    }
    const guardado = await this.miembros.guardar(objetivo);
    this.eventos.aTablero(tableroId, 'miembro:actualizado', guardado);
    return guardado;
  }
}
