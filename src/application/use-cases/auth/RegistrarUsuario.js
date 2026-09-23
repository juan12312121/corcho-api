import { UseCase } from '../../shared/UseCase.js';
import { ConflictoError } from '../../shared/errors.js';
import { Usuario } from '../../../domain/entities/Usuario.js';
import { Tablero } from '../../../domain/entities/Tablero.js';
import { Miembro } from '../../../domain/entities/Miembro.js';
import { Categoria } from '../../../domain/entities/Categoria.js';

/** Crea la cuenta y, de regalo, su primer tablero personal. Devuelve la sesión. */
export class RegistrarUsuario extends UseCase {
  constructor({ usuarios, uow, hasher, tokens }) {
    super();
    this.usuarios = usuarios;
    this.uow = uow;
    this.hasher = hasher;
    this.tokens = tokens;
  }

  async ejecutar({ nombre, email, password, color }) {
    if (await this.usuarios.porEmail(email)) throw new ConflictoError('EMAIL_REGISTRADO', 'Ese correo ya está registrado');
    const nuevo = Usuario.registrar({ nombre, email, color, passwordHash: await this.hasher.cifrar(password) });

    const usuario = await this.uow.ejecutar(async (repos) => {
      const u = await repos.usuarios.crear(nuevo);
      const personal = await repos.tableros.crear(Tablero.crear({ nombre: 'Mis finanzas', tipo: 'personal', propietarioId: u.id }));
      await repos.miembros.crear(Miembro.propietario(personal.id, u.id));
      await repos.categorias.crearVarias(Categoria.baseDe(personal.id));
      return u;
    });
    return { token: this.tokens.firmar(usuario), usuario };
  }
}
