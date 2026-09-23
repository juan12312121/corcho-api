import { PagoRepository } from '../../../domain/repositories/PagoRepository.js';
import { Pago } from '../../../domain/entities/Pago.js';
import { Pagina } from '../../../application/shared/Pagina.js';
import { PagoModel } from '../models/PagoModel.js';

const aEntidad = (fila) => (fila ? new Pago(fila) : null);

export class PgPagoRepository extends PagoRepository {
  constructor(db) {
    super();
    this.modelo = new PagoModel(db);
  }

  async porId(id, tableroId) {
    return aEntidad(await this.modelo.buscarUno({ id, tableroId }));
  }

  async listar(tableroId, { filtros = {}, pagina, porPagina } = {}) {
    const p = await this.modelo.paginar({ ...filtros, tableroId }, { pagina, porPagina });
    return new Pagina(p.items.map(aEntidad), p.meta);
  }

  async crear(pago) {
    return aEntidad(await this.modelo.insertar(pago));
  }

  async guardar(pago) {
    return aEntidad(await this.modelo.actualizar(pago.id, pago));
  }

  /** El pago que ya se registró para esa sesión de Checkout (para no registrarlo dos veces). */
  async porSesionStripe(sesionId) {
    return aEntidad(await this.modelo.buscarUno({ stripeSesionId: sesionId }));
  }

  async borrar(id) {
    await this.modelo.borrar(id);
  }

  async pagadoPorUsuarioEnNota(notaId, acreedorId) {
    const filas = await this.modelo.filas(
      `SELECT de_usuario_id AS "usuarioId", sum(monto) AS total
         FROM pagos
        WHERE nota_id = $1 AND a_usuario_id = $2 AND estado = 'confirmado'
        GROUP BY de_usuario_id`,
      [notaId, acreedorId],
    );
    return new Map(filas.map((f) => [f.usuarioId, f.total]));
  }

  async hayConfirmadosDeNota(notaId) {
    return Boolean(await this.modelo.fila(`SELECT 1 FROM pagos WHERE nota_id = $1 AND estado = 'confirmado' LIMIT 1`, [notaId]));
  }
}
