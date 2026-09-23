import { UsuarioRepository } from '../../../domain/repositories/UsuarioRepository.js';
import { Usuario } from '../../../domain/entities/Usuario.js';
import { UsuarioModel } from '../models/UsuarioModel.js';

const aEntidad = (fila) => (fila ? new Usuario(fila) : null);

export class PgUsuarioRepository extends UsuarioRepository {
  constructor(db) {
    super();
    this.modelo = new UsuarioModel(db);
  }

  async porId(id) {
    return aEntidad(await this.modelo.buscarUno({ id }));
  }

  async porCuentaStripe(cuentaId) {
    return aEntidad(await this.modelo.buscarUno({ stripeCuentaId: cuentaId }));
  }

  async porEmail(email) {
    return aEntidad(await this.modelo.fila(`SELECT ${this.modelo.select()} FROM usuarios WHERE lower(email) = lower($1)`, [email]));
  }

  async crear(usuario) {
    return aEntidad(await this.modelo.insertar(usuario));
  }

  async guardar(usuario) {
    return aEntidad(await this.modelo.actualizar(usuario.id, usuario));
  }
}
