/**
 * Puerto: ejecutar varias escrituras como una sola (todo o nada).
 *   await uow.ejecutar(async (repos) => { await repos.tableros.crear(...); await repos.miembros.crear(...); })
 * `repos` trae los mismos repositorios, atados a la transacción.
 */
export class UnitOfWork {
  async ejecutar(_trabajo) {
    throw new Error('UnitOfWork.ejecutar() no está implementado');
  }
}
