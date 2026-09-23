import { UseCase } from '../../shared/UseCase.js';

const LIMITE_TABLERO = 300;

/**
 * Las notas del corcho (las de arriba al final, por z). Por omisión solo las que no están archivadas;
 * `archivadas: true` trae el archivo. `q` busca en título y descripción.
 */
export class ListarNotas extends UseCase {
  constructor({ acceso, notas }) {
    super();
    this.acceso = acceso;
    this.notas = notas;
  }

  async ejecutar({ actor, tableroId, orden = 'z', archivadas = false, ...filtros }) {
    await this.acceso.exigir(tableroId, actor.id);
    return this.notas.listar(tableroId, { filtros: { ...filtros, archivada: archivadas }, orden, limite: LIMITE_TABLERO });
  }
}
