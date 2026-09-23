import { UseCase } from '../../shared/UseCase.js';
import { netos, entrePares, simplificar } from '../../../domain/services/Balance.js';
import { resumenPersonal } from '../../../domain/services/ResumenPersonal.js';
import { resumenPlanes } from '../../../domain/services/ResumenPlanes.js';
import { resumenPresupuestos } from '../../../domain/services/ResumenPresupuestos.js';
import { sumar } from '../../../domain/shared/Dinero.js';

const SIN_CATEGORIA = { nombre: 'Sin categoría', icono: 'label_off', color: '#74777F' };

/**
 * Panel lateral del tablero:
 *  - personal:   en qué se fue el dinero del mes (por categoría), recibos, lo que debo y me deben.
 *  - compartido: saldo de cada miembro, quién le debe a quién y cómo quedar a mano.
 *  - ambos:      lo que va "a meses" (compras y deudas) y el avance de los presupuestos del mes.
 */
export class ObtenerBalance extends UseCase {
  constructor({ acceso, miembros, notas, categorias, presupuestos, ingresos, consultasBalance }) {
    super();
    this.ingresos = ingresos;
    this.presupuestos = presupuestos;
    this.acceso = acceso;
    this.miembros = miembros;
    this.notas = notas;
    this.categorias = categorias;
    this.consultasBalance = consultasBalance;
  }

  async ejecutar({ actor, tableroId }) {
    const { tablero } = await this.acceso.exigir(tableroId, actor.id);
    const notas = await this.notas.listar(tableroId, { filtros: {}, orden: 'fecha', limite: 2000 });
    const planes = resumenPlanes(notas);
    const presupuestos = resumenPresupuestos(await this.presupuestos.listar(tableroId), notas);
    const balance = tablero.esPersonal() ? await this.#personal(tableroId, notas) : await this.#compartido(tableroId, actor.id);
    return { ...balance, planes, presupuestos };
  }

  async #personal(tableroId, notas) {
    const resumen = resumenPersonal(notas, new Date(), await this.ingresos.listar(tableroId));
    const categorias = new Map((await this.categorias.listar(tableroId)).map((c) => [c.id, c]));
    return {
      ...resumen,
      porCategoria: resumen.porCategoria.map(({ categoriaId, total }) => {
        const c = categorias.get(categoriaId) ?? SIN_CATEGORIA;
        return { categoriaId, nombre: c.nombre, icono: c.icono, color: c.color, total };
      }),
    };
  }

  async #compartido(tableroId, yoId) {
    const [deudas, miembros, totales] = await Promise.all([
      this.consultasBalance.deudasDe(tableroId),
      this.miembros.listarConUsuarios(tableroId),
      this.consultasBalance.totales(tableroId),
    ]);
    const saldos = netos(deudas);
    const pares = entrePares(deudas);
    return {
      tipo: 'compartido',
      totales,
      netos: miembros.map((m) => ({ usuarioId: m.usuarioId, nombre: m.apodo || m.nombre, color: m.color, neto: saldos[m.usuarioId] ?? 0 })),
      entrePares: pares,
      sugerencias: simplificar(deudas),
      mio: {
        neto: saldos[yoId] ?? 0,
        debo: sumar(...pares.filter((p) => p.de === yoId).map((p) => p.monto)),
        meDeben: sumar(...pares.filter((p) => p.a === yoId).map((p) => p.monto)),
      },
    };
  }
}
