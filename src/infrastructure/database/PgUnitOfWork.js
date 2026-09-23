import { UnitOfWork } from '../../application/ports/UnitOfWork.js';
import { RepositoryFactory } from '../persistence/RepositoryFactory.js';

/** Transacción de Postgres: el trabajo recibe repositorios atados al mismo cliente. */
export class PgUnitOfWork extends UnitOfWork {
  /** @param {import('pg').Pool} pool */
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async ejecutar(trabajo) {
    const cliente = await this.pool.connect();
    try {
      await cliente.query('BEGIN');
      const resultado = await trabajo(RepositoryFactory.crear(cliente));
      await cliente.query('COMMIT');
      return resultado;
    } catch (e) {
      await cliente.query('ROLLBACK');
      throw e;
    } finally {
      cliente.release();
    }
  }
}
