import { UseCase } from '../../shared/UseCase.js';

/** Pantalla de inicio: mis tableros (personales y compartidos) con mi saldo en cada uno. */
export class ListarMisTableros extends UseCase {
  constructor({ tableros, consultasBalance }) {
    super();
    this.tableros = tableros;
    this.consultasBalance = consultasBalance;
  }

  async ejecutar({ actor, archivado = false, tipo }) {
    const [lista, saldos] = await Promise.all([
      this.tableros.resumenDeUsuario(actor.id, { archivado, tipo }),
      this.consultasBalance.netosPorTablero(actor.id),
    ]);
    return lista.map((t) => ({ ...t, miNeto: saldos[t.id] ?? 0 }));
  }
}
