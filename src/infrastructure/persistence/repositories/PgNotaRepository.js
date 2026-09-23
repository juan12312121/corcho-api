import { NotaRepository } from '../../../domain/repositories/NotaRepository.js';
import { Nota } from '../../../domain/entities/Nota.js';
import { NotaModel } from '../models/NotaModel.js';
import { NotaParteModel } from '../models/NotaParteModel.js';
import { AbonoModel } from '../models/AbonoModel.js';

/** Notas + sus partes (tabla nota_partes) + historial de abonos; al leer, también sus fotos y cuántos comentarios tienen. */
export class PgNotaRepository extends NotaRepository {
  constructor(db) {
    super();
    this.notas = new NotaModel(db);
    this.partes = new NotaParteModel(db);
    this.abonos = new AbonoModel(db);
  }

  async porId(id, tableroId) {
    const fila = await this.notas.buscarUno({ id, tableroId });
    return fila ? (await this.#conPartes([fila]))[0] : null;
  }

  /** `filtros.q` busca en título y descripción; el resto son igualdades (incluido `archivada`). */
  async listar(tableroId, { filtros = {}, orden = 'z', limite = 300 } = {}) {
    const { q, ...iguales } = filtros;
    const w = this.notas.where({ ...iguales, tableroId });
    const valores = [...w.valores];
    let sql = w.sql;
    if (q) {
      // Los comodines de LIKE que escriba la persona se buscan literales
      valores.push(`%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
      const n = valores.length;
      sql += `${sql ? ' AND' : ' WHERE'} (titulo ILIKE $${n} OR descripcion ILIKE $${n})`;
    }
    valores.push(limite);
    const filas = await this.notas.filas(
      `SELECT ${this.notas.select()} FROM notas${sql}${this.notas.orderBy(orden)} LIMIT $${valores.length}`,
      valores,
    );
    return this.#conPartes(filas);
  }

  /** Recibos por pagar que vencen en la fecha y préstamos a meses sin liquidar, de todos los tableros. */
  async paraRecordatorios(fecha) {
    const filas = await this.notas.filas(
      `SELECT ${this.notas.select()} FROM notas
        WHERE NOT archivada AND (
          (estado = 'por_pagar' AND tipo <> 'recordatorio' AND vence_en = $1)
          OR (tipo = 'prestamo' AND plazo_meses IS NOT NULL AND estado <> 'liquidada'))`,
      [fecha],
    );
    return this.#conPartes(filas);
  }

  async crear(nota) {
    const fila = await this.notas.insertar(nota);
    await this.#reemplazarPartes(fila.id, nota.partes);
    return this.porId(fila.id, fila.tableroId);
  }

  async guardar(nota) {
    await this.notas.actualizar(nota.id, nota);
    await this.#reemplazarPartes(nota.id, nota.partes);
    return this.porId(nota.id, nota.tableroId);
  }

  async guardarPosicion(nota) {
    const { posX, posY, rotacion, z } = nota;
    const fila = await this.notas.actualizar(nota.id, { posX, posY, rotacion, z });
    return new Nota({ ...fila, partes: nota.partes });
  }

  async borrar(id) {
    await this.notas.borrar(id);
  }

  async siguienteZ(tableroId) {
    const { z } = await this.notas.fila(`SELECT coalesce(max(z), 0)::int + 1 AS z FROM notas WHERE tablero_id = $1`, [tableroId]);
    return z;
  }

  async registrarAbono({ notaId, monto, registradoPor }) {
    await this.abonos.insertar({ notaId, monto, registradoPor });
  }

  // ---------- partes ----------

  async #reemplazarPartes(notaId, partes = []) {
    await this.partes.ejecutar(`DELETE FROM nota_partes WHERE nota_id = $1`, [notaId]);
    if (!partes.length) return;
    await this.partes.ejecutar(
      `INSERT INTO nota_partes (nota_id, usuario_id, monto, porcentaje, proporcion, liquidada)
       SELECT $1, * FROM unnest($2::uuid[], $3::numeric[], $4::numeric[], $5::numeric[], $6::boolean[])`,
      [
        notaId,
        partes.map((p) => p.usuarioId),
        partes.map((p) => p.monto),
        partes.map((p) => p.porcentaje ?? null),
        partes.map((p) => p.proporcion ?? null),
        partes.map((p) => Boolean(p.liquidada)),
      ],
    );
  }

  /** Pega sus partes a cada nota (en el orden en que entraron los miembros) y arma las entidades. */
  async #conPartes(filas) {
    if (!filas.length) return [];
    const partes = await this.partes.filas(
      `SELECT np.nota_id AS "notaId", np.usuario_id AS "usuarioId", np.monto, np.porcentaje, np.proporcion, np.liquidada
         FROM nota_partes np
         JOIN notas n ON n.id = np.nota_id
         LEFT JOIN tablero_miembros m ON m.tablero_id = n.tablero_id AND m.usuario_id = np.usuario_id
        WHERE np.nota_id = ANY($1::uuid[])
        ORDER BY m.unido_en NULLS LAST, np.usuario_id`,
      [filas.map((f) => f.id)],
    );
    const ids = filas.map((f) => f.id);
    const [adjuntos, comentarios] = await Promise.all([
      this.notas.filas(
        `SELECT id, nota_id AS "notaId", url, public_id AS "publicId", ancho, alto, subido_por AS "subidoPor"
           FROM adjuntos WHERE nota_id = ANY($1::uuid[]) ORDER BY creado_en`,
        [ids],
      ),
      this.notas.filas(`SELECT nota_id AS "notaId", count(*)::int AS n FROM comentarios WHERE nota_id = ANY($1::uuid[]) GROUP BY nota_id`, [ids]),
    ]);
    const agrupar = (lista) => {
      const mapa = new Map();
      for (const { notaId, ...resto } of lista) mapa.set(notaId, [...(mapa.get(notaId) ?? []), resto]);
      return mapa;
    };
    const partesPorNota = agrupar(partes);
    const adjuntosPorNota = agrupar(adjuntos);
    const comentariosPorNota = new Map(comentarios.map((c) => [c.notaId, c.n]));
    return filas.map(
      (f) => new Nota({ ...f, partes: partesPorNota.get(f.id) ?? [], adjuntos: adjuntosPorNota.get(f.id) ?? [], comentarios: comentariosPorNota.get(f.id) ?? 0 }),
    );
  }
}
