import { Pagina } from '../../application/shared/Pagina.js';

export const aSnake = (campo) => campo.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);

/**
 * Modelo de persistencia: describe UNA tabla y trae el SQL genérico sobre ella.
 * Trabaja con nombres camelCase (los del dominio) y los traduce a snake_case de Postgres;
 * las filas ya salen en camelCase gracias a los alias del SELECT.
 *
 * Los hijos declaran (estáticos): tabla, columnas, ordenables, ordenDefault, soloLectura.
 * Todo el SQL es parametrizado y los nombres de columna salen SOLO de `columnas`.
 */
export class BaseModel {
  static tabla = '';
  static columnas = [];
  static ordenables = ['creadoEn'];
  static ordenDefault = '-creadoEn';
  /** Columnas que la base llena sola y nunca se escriben desde aquí */
  static soloLectura = ['id', 'creadoEn', 'actualizadoEn'];

  /** @param {import('pg').Pool | import('pg').PoolClient} db */
  constructor(db) {
    this.db = db;
  }

  get tabla() {
    return this.constructor.tabla;
  }

  get columnas() {
    return this.constructor.columnas;
  }

  esColumna(campo) {
    return this.columnas.includes(campo);
  }

  /** `"pagado_por" AS "pagadoPor", ...` con alias de tabla opcional. */
  select(alias = '') {
    const p = alias ? `${alias}.` : '';
    return this.columnas.map((c) => `${p}"${aSnake(c)}" AS "${c}"`).join(', ');
  }

  // ---------- ejecución ----------

  async filas(sql, params = []) {
    return (await this.db.query(sql, params)).rows;
  }

  async fila(sql, params = []) {
    return (await this.db.query(sql, params)).rows[0] ?? null;
  }

  async ejecutar(sql, params = []) {
    return (await this.db.query(sql, params)).rowCount ?? 0;
  }

  // ---------- armado ----------

  /** WHERE con igualdades; `null` se vuelve IS NULL. Las llaves deben ser columnas declaradas. */
  where(donde = {}, desde = 1) {
    const partes = [];
    const valores = [];
    for (const [campo, valor] of Object.entries(donde)) {
      if (valor === undefined) continue;
      if (!this.esColumna(campo)) throw new Error(`${this.tabla} no tiene la columna ${campo}`);
      if (valor === null) {
        partes.push(`"${aSnake(campo)}" IS NULL`);
        continue;
      }
      valores.push(valor);
      partes.push(`"${aSnake(campo)}" = $${desde + valores.length - 1}`);
    }
    return { sql: partes.length ? ` WHERE ${partes.join(' AND ')}` : '', valores };
  }

  /** "campo" ascendente, "-campo" descendente; solo columnas ordenables. */
  orderBy(orden) {
    const o = orden || this.constructor.ordenDefault;
    const desc = o.startsWith('-');
    const campo = desc ? o.slice(1) : o;
    if (!this.constructor.ordenables.includes(campo)) throw new Error(`${this.tabla} no se ordena por ${campo}`);
    return ` ORDER BY "${aSnake(campo)}" ${desc ? 'DESC' : 'ASC'}, "id"`;
  }

  escribibles(datos) {
    return Object.keys(datos).filter((c) => this.esColumna(c) && !this.constructor.soloLectura.includes(c) && datos[c] !== undefined);
  }

  // ---------- CRUD genérico ----------

  buscarUno(donde) {
    const w = this.where(donde);
    return this.fila(`SELECT ${this.select()} FROM "${this.tabla}"${w.sql} LIMIT 1`, w.valores);
  }

  buscar(donde = {}, { orden, limite } = {}) {
    const w = this.where(donde);
    const tope = limite ? ` LIMIT ${Number(limite)}` : '';
    return this.filas(`SELECT ${this.select()} FROM "${this.tabla}"${w.sql}${this.orderBy(orden)}${tope}`, w.valores);
  }

  async paginar(donde = {}, { pagina = 1, porPagina = 50, orden } = {}) {
    pagina = Math.max(1, Number(pagina) || 1);
    porPagina = Math.min(200, Math.max(1, Number(porPagina) || 50));
    const w = this.where(donde);
    const filas = await this.filas(
      `SELECT ${this.select()}, count(*) OVER()::int AS "_total" FROM "${this.tabla}"${w.sql}${this.orderBy(orden)}
       LIMIT $${w.valores.length + 1} OFFSET $${w.valores.length + 2}`,
      [...w.valores, porPagina, (pagina - 1) * porPagina],
    );
    const total = filas[0]?._total ?? 0;
    return new Pagina(filas.map(({ _total, ...f }) => f), { total, pagina, porPagina });
  }

  insertar(datos) {
    const cols = this.escribibles(datos);
    return this.fila(
      `INSERT INTO "${this.tabla}" (${cols.map((c) => `"${aSnake(c)}"`).join(', ')})
       VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')})
       RETURNING ${this.select()}`,
      cols.map((c) => datos[c]),
    );
  }

  actualizar(id, datos) {
    const cols = this.escribibles(datos);
    const set = cols.map((c, i) => `"${aSnake(c)}" = $${i + 2}`);
    if (this.esColumna('actualizadoEn')) set.push('"actualizado_en" = now()');
    if (!set.length) return this.buscarUno({ id });
    return this.fila(`UPDATE "${this.tabla}" SET ${set.join(', ')} WHERE "id" = $1 RETURNING ${this.select()}`, [id, ...cols.map((c) => datos[c])]);
  }

  async borrar(id) {
    return (await this.ejecutar(`DELETE FROM "${this.tabla}" WHERE "id" = $1`, [id])) > 0;
  }
}
