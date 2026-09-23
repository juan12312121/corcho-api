import { UseCase } from '../../shared/UseCase.js';
import { reporteDeGastos } from '../../../domain/services/Reportes.js';

/** Gasto de los últimos N meses por mes, categoría y persona, con detalle para exportar. */
export class ObtenerReporte extends UseCase {
  constructor({ acceso, notas, categorias, miembros }) {
    super();
    this.acceso = acceso;
    this.notas = notas;
    this.categorias = categorias;
    this.miembros = miembros;
  }

  async ejecutar({ actor, tableroId, meses = 6 }) {
    const { tablero } = await this.acceso.exigir(tableroId, actor.id);
    const [notas, categorias, miembros] = await Promise.all([
      this.notas.listar(tableroId, { filtros: {}, orden: 'fecha', limite: 5000 }),
      this.categorias.listar(tableroId),
      this.miembros.listarConUsuarios(tableroId),
    ]);
    return {
      tablero: { id: tablero.id, nombre: tablero.nombre, tipo: tablero.tipo, moneda: tablero.moneda },
      ...reporteDeGastos(notas, { meses }),
      // Catálogos para que el cliente ponga nombres y colores
      categorias: categorias.map(({ id, nombre, icono, color }) => ({ id, nombre, icono, color })),
      personas: miembros.map((m) => ({ usuarioId: m.usuarioId, nombre: m.apodo || m.nombre, color: m.color })),
    };
  }
}
