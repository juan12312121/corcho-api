import { MiembroRepository } from '../../../domain/repositories/MiembroRepository.js';
import { Miembro } from '../../../domain/entities/Miembro.js';
import { MiembroModel } from '../models/MiembroModel.js';

const aEntidad = (fila) => (fila ? new Miembro(fila) : null);

export class PgMiembroRepository extends MiembroRepository {
  constructor(db) {
    super();
    this.modelo = new MiembroModel(db);
  }

  async de(tableroId, usuarioId) {
    return aEntidad(await this.modelo.buscarUno({ tableroId, usuarioId }));
  }

  listarConUsuarios(tableroId) {
    return this.modelo.filas(
      `SELECT m.usuario_id AS "usuarioId", m.rol, m.apodo, m.unido_en AS "unidoEn",
              u.nombre, u.email, u.color, u.avatar_url AS "avatarUrl",
              u.clabe, u.banco, u.titular_cuenta AS "titularCuenta", u.stripe_listo AS "cobraConTarjeta",
              -- Solo el porcentaje del total de ingresos del tablero: el monto es privado
              round(100 * u.ingreso_mensual / nullif(sum(u.ingreso_mensual) OVER (), 0), 2)::float AS "pesoIngreso"
         FROM tablero_miembros m JOIN usuarios u ON u.id = m.usuario_id
        WHERE m.tablero_id = $1
        ORDER BY m.unido_en`,
      [tableroId],
    );
  }

  /** Solo para la integración de avisos: el teléfono nunca sale en el API de miembros. */
  contactosParaAvisos(tableroIds) {
    return this.modelo.filas(
      `SELECT m.tablero_id AS "tableroId", m.usuario_id AS "usuarioId", coalesce(m.apodo, u.nombre) AS nombre,
              u.telefono, u.avisos_whatsapp AS "avisosWhatsapp"
         FROM tablero_miembros m JOIN usuarios u ON u.id = m.usuario_id
        WHERE m.tablero_id = ANY($1::uuid[])`,
      [tableroIds],
    );
  }

  async idsDe(tableroId) {
    return (await this.modelo.buscar({ tableroId })).map((m) => m.usuarioId);
  }

  async crear(miembro) {
    return aEntidad(await this.modelo.insertar(miembro));
  }

  async guardar(miembro) {
    return aEntidad(await this.modelo.actualizar(miembro.id, miembro));
  }

  async borrar(id) {
    await this.modelo.borrar(id);
  }
}
