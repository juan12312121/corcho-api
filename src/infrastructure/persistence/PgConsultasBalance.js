import { ConsultasBalance } from '../../application/ports/ConsultasBalance.js';

/**
 * Junta las partes de notas pagadas y los pagos confirmados como "deudas"
 * (ver domain/services/Balance.js). Las deudas externas no tienen partes: no entran.
 */
const DEUDAS = `
  SELECT n.tablero_id, np.usuario_id AS deudor, n.pagado_por AS acreedor, np.monto
    FROM nota_partes np JOIN notas n ON n.id = np.nota_id
   WHERE n.estado <> 'por_pagar' AND n.tipo <> 'recordatorio' AND n.pagado_por IS NOT NULL AND n.contraparte IS NULL
  UNION ALL
  SELECT p.tablero_id, p.a_usuario_id AS deudor, p.de_usuario_id AS acreedor, p.monto
    FROM pagos p
   WHERE p.estado = 'confirmado'`;

export class PgConsultasBalance extends ConsultasBalance {
  constructor(db) {
    super();
    this.db = db;
  }

  async deudasDe(tableroId) {
    const { rows } = await this.db.query(`SELECT deudor, acreedor, monto FROM (${DEUDAS}) d WHERE tablero_id = $1`, [tableroId]);
    return rows;
  }

  async netosPorTablero(usuarioId) {
    const { rows } = await this.db.query(
      `SELECT tablero_id AS "tableroId",
              sum(CASE WHEN acreedor = $1 THEN monto ELSE 0 END) - sum(CASE WHEN deudor = $1 THEN monto ELSE 0 END) AS neto
         FROM (${DEUDAS}) d
        WHERE (deudor = $1 OR acreedor = $1) AND deudor <> acreedor
        GROUP BY tablero_id`,
      [usuarioId],
    );
    return Object.fromEntries(rows.map((f) => [f.tableroId, f.neto]));
  }

  async totales(tableroId) {
    const { rows } = await this.db.query(
      `SELECT coalesce(sum(monto) FILTER (WHERE estado <> 'por_pagar'), 0) AS gastado,
              coalesce(sum(monto) FILTER (WHERE estado = 'por_pagar'), 0) AS "porPagar",
              count(*) FILTER (WHERE estado = 'por_pagar' AND vence_en < current_date)::int AS vencidas
         FROM notas WHERE tablero_id = $1 AND tipo <> 'recordatorio' AND contraparte IS NULL`,
      [tableroId],
    );
    return rows[0];
  }
}
