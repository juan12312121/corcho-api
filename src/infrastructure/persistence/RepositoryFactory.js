import { PgUsuarioRepository } from './repositories/PgUsuarioRepository.js';
import { PgTableroRepository } from './repositories/PgTableroRepository.js';
import { PgMiembroRepository } from './repositories/PgMiembroRepository.js';
import { PgInvitacionRepository } from './repositories/PgInvitacionRepository.js';
import { PgNotaRepository } from './repositories/PgNotaRepository.js';
import { PgPagoRepository } from './repositories/PgPagoRepository.js';
import { PgActividadRepository } from './repositories/PgActividadRepository.js';
import { PgCategoriaRepository } from './repositories/PgCategoriaRepository.js';
import { PgPresupuestoRepository } from './repositories/PgPresupuestoRepository.js';
import { PgAdjuntoRepository } from './repositories/PgAdjuntoRepository.js';
import { PgComentarioRepository } from './repositories/PgComentarioRepository.js';
import { PgRecuperacionRepository } from './repositories/PgRecuperacionRepository.js';
import { PgIngresoRepository } from './repositories/PgIngresoRepository.js';
import { PgMetaRepository } from './repositories/PgMetaRepository.js';

/**
 * Fábrica de repositorios: con el pool da los de uso normal y con un cliente
 * de transacción da los mismos atados a esa transacción (lo usa PgUnitOfWork).
 */
export class RepositoryFactory {
  /** @param {import('pg').Pool | import('pg').PoolClient} db */
  static crear(db) {
    return {
      usuarios: new PgUsuarioRepository(db),
      tableros: new PgTableroRepository(db),
      miembros: new PgMiembroRepository(db),
      invitaciones: new PgInvitacionRepository(db),
      notas: new PgNotaRepository(db),
      pagos: new PgPagoRepository(db),
      actividad: new PgActividadRepository(db),
      categorias: new PgCategoriaRepository(db),
      presupuestos: new PgPresupuestoRepository(db),
      adjuntos: new PgAdjuntoRepository(db),
      comentarios: new PgComentarioRepository(db),
      recuperaciones: new PgRecuperacionRepository(db),
      ingresos: new PgIngresoRepository(db),
      metas: new PgMetaRepository(db),
    };
  }
}
