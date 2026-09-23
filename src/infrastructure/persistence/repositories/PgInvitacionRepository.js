import { InvitacionRepository } from '../../../domain/repositories/InvitacionRepository.js';
import { Invitacion } from '../../../domain/entities/Invitacion.js';
import { InvitacionModel } from '../models/InvitacionModel.js';

const aEntidad = (fila) => (fila ? new Invitacion(fila) : null);

export class PgInvitacionRepository extends InvitacionRepository {
  constructor(db) {
    super();
    this.modelo = new InvitacionModel(db);
  }

  async porId(id, tableroId) {
    return aEntidad(await this.modelo.buscarUno({ id, tableroId }));
  }

  async porCodigo(codigo, { bloquear = false } = {}) {
    const candado = bloquear ? ' FOR UPDATE' : '';
    return aEntidad(await this.modelo.fila(`SELECT ${this.modelo.select()} FROM invitaciones WHERE codigo = $1${candado}`, [codigo]));
  }

  async listar(tableroId) {
    return (await this.modelo.buscar({ tableroId })).map(aEntidad);
  }

  async crear(invitacion) {
    return aEntidad(await this.modelo.insertar(invitacion));
  }

  async guardar(invitacion) {
    return aEntidad(await this.modelo.actualizar(invitacion.id, invitacion));
  }

  vistaPrevia(codigo) {
    return this.modelo.fila(
      `SELECT i.codigo, i.estado, i.rol, i.email, i.expira_en AS "expiraEn", i.usos, i.usos_max AS "usosMax",
              t.id AS "tableroId", t.nombre AS "tablero", t.descripcion, t.moneda,
              u.nombre AS "invitadoPor",
              (SELECT count(*)::int FROM tablero_miembros m WHERE m.tablero_id = t.id) AS "miembros"
         FROM invitaciones i
         JOIN tableros t ON t.id = i.tablero_id
         JOIN usuarios u ON u.id = i.invitado_por
        WHERE i.codigo = $1`,
      [codigo],
    );
  }

  pendientesPara(email) {
    return this.modelo.filas(
      `SELECT i.id, i.codigo, i.rol, i.expira_en AS "expiraEn", i.creado_en AS "creadoEn",
              t.id AS "tableroId", t.nombre AS "tablero", u.nombre AS "invitadoPor"
         FROM invitaciones i
         JOIN tableros t ON t.id = i.tablero_id
         JOIN usuarios u ON u.id = i.invitado_por
        WHERE lower(i.email) = lower($1) AND i.estado = 'pendiente' AND i.expira_en > now()
          AND NOT EXISTS (SELECT 1 FROM tablero_miembros m JOIN usuarios yo ON yo.id = m.usuario_id
                           WHERE m.tablero_id = i.tablero_id AND lower(yo.email) = lower($1))
        ORDER BY i.creado_en DESC`,
      [email],
    );
  }

  async cancelarPendientes(tableroId) {
    await this.modelo.ejecutar(`UPDATE invitaciones SET estado = 'cancelada' WHERE tablero_id = $1 AND estado = 'pendiente'`, [tableroId]);
  }
}
