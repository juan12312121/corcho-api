import { UseCase } from '../../shared/UseCase.js';
import { ReglaDeNegocioError } from '../../../domain/shared/errors.js';
import { Nota } from '../../../domain/entities/Nota.js';
import { Ingreso } from '../../../domain/entities/Ingreso.js';

const COLUMNAS = 5;
const PASO_X = 250;
const PASO_Y = 260;

/**
 * Importa movimientos de un estado de cuenta (el navegador ya leyó el CSV):
 *  - cargos → notas de gasto pagadas por mí. En un tablero personal van directo al
 *    archivo (son historia: cuentan en resúmenes y reportes sin llenar el corcho).
 *  - abonos → ingresos (solo tablero personal).
 * Todo o nada, en una transacción.
 */
export class ImportarMovimientos extends UseCase {
  constructor({ acceso, miembros, notas, categorias, uow, avisos, bitacora }) {
    super();
    this.acceso = acceso;
    this.miembros = miembros;
    this.notas = notas;
    this.categorias = categorias;
    this.uow = uow;
    this.avisos = avisos;
    this.bitacora = bitacora;
  }

  async ejecutar({ actor, tableroId, movimientos }) {
    const { tablero } = await this.acceso.exigir(tableroId, actor.id);
    const [miembrosIds, z, categorias] = await Promise.all([
      this.miembros.idsDe(tableroId),
      this.notas.siguienteZ(tableroId),
      this.categorias.listar(tableroId),
    ]);
    const categoriasValidas = new Set(categorias.map((c) => c.id));
    const fuera = movimientos.find((m) => m.categoriaId && !categoriasValidas.has(m.categoriaId));
    if (fuera) throw new ReglaDeNegocioError('CATEGORIA_INVALIDA', `La categoría de "${fuera.titulo}" no es de este tablero`);

    const gastos = movimientos.filter((m) => m.tipo === 'gasto');
    const ingresos = movimientos.filter((m) => m.tipo === 'ingreso');
    const archivar = tablero.esPersonal();

    const resultado = await this.uow.ejecutar(async (repos) => {
      const notas = [];
      for (const [i, m] of gastos.entries()) {
        const nota = Nota.crear(
          {
            titulo: m.titulo,
            monto: m.monto,
            fecha: m.fecha,
            categoriaId: m.categoriaId ?? null,
            estado: 'pagada',
            posX: 40 + (i % COLUMNAS) * PASO_X,
            posY: 40 + Math.floor(i / COLUMNAS) * PASO_Y,
          },
          { tablero, autorId: actor.id, miembrosIds, z: z + i },
        );
        if (archivar) nota.archivar();
        notas.push(await repos.notas.crear(nota));
      }
      const creados = [];
      for (const m of ingresos) {
        creados.push(await repos.ingresos.crear(Ingreso.registrar({ concepto: m.titulo, monto: m.monto, fecha: m.fecha }, { tablero, autorId: actor.id })));
      }
      return { notas, ingresos: creados };
    });

    for (const nota of resultado.notas) if (!nota.archivada) this.avisos.publicar(tableroId, 'nota:creada', nota);
    this.avisos.publicar(tableroId, 'notas:importadas', { gastos: resultado.notas.length, ingresos: resultado.ingresos.length }, { cambiaBalance: true });
    await this.bitacora.registrar(tableroId, actor.id, 'notas:importadas', { gastos: resultado.notas.length, ingresos: resultado.ingresos.length });
    return { gastos: resultado.notas.length, ingresos: resultado.ingresos.length, archivadas: archivar };
  }
}
