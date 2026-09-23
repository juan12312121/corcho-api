import { BaseEntity } from '../shared/BaseEntity.js';
import { ReglaDeNegocioError, EstadoInvalidoError } from '../shared/errors.js';
import { aCentavos, aPesos, sumar } from '../shared/Dinero.js';
import { hoy as hoyDe } from '../shared/Fechas.js';
import { repartir } from '../services/Reparto.js';
import { siguienteFecha } from '../services/Recurrencia.js';
import { mensualidad, validarPlazo } from '../services/PlanMeses.js';

export const TIPOS_NOTA = ['gasto', 'servicio', 'prestamo', 'recordatorio'];
export const COLORES_NOTA = ['amarillo', 'azul', 'verde', 'rosa', 'naranja', 'morado'];
export const DIRECCIONES = ['debo', 'me_deben'];

const CAMPOS_LIBRES = ['descripcion', 'categoriaId', 'fecha', 'venceEn', 'recurrencia', 'color', 'pinColor', 'posX', 'posY', 'rotacion', 'z'];
const CAMPOS_DINERO = ['monto', 'modoReparto', 'participantes', 'pagadoPor'];
const CAMPOS_EXTERNA = ['monto', 'contraparte', 'direccion'];

const regla = (codigo, mensaje, detalles) => new ReglaDeNegocioError(codigo, mensaje, detalles);
const rotacionAlAzar = () => Math.round((Math.random() * 8 - 4) * 10) / 10;

/**
 * Una nota clavada en el corcho. Según el tablero y el tipo se comporta distinto:
 *
 *  | caso                          | partes                         | balance entre miembros |
 *  |-------------------------------|--------------------------------|------------------------|
 *  | recordatorio                  | ninguna                        | no                     |
 *  | gasto/servicio personal       | solo el dueño                  | no                     |
 *  | deuda externa (personal)      | ninguna; se lleva con abonos   | no                     |
 *  | gasto/servicio/préstamo compartido | repartidas entre miembros | sí (cuando ya se pagó) |
 *
 * Estados: por_pagar → pagada → liquidada (todos le pagaron su parte a quien pagó,
 * o en una deuda externa: ya se abonó todo).
 */
export class Nota extends BaseEntity {
  /**
   * @param {object} datos  lo que pidió el usuario
   * @param {{ tablero: import('./Tablero.js').Tablero, autorId: string, miembrosIds: string[], z: number, ahora?: Date }} contexto
   */
  static crear(datos, { tablero, autorId, miembrosIds, z, ahora = new Date() }) {
    const tipo = datos.tipo ?? 'gasto';
    if (!TIPOS_NOTA.includes(tipo)) throw regla('TIPO_INVALIDO', `Tipo de nota desconocido: ${tipo}`);

    const nota = new Nota({
      tableroId: tablero.id,
      creadoPor: autorId,
      tipo,
      titulo: Nota.#tituloValido(datos.titulo),
      descripcion: datos.descripcion ?? null,
      categoriaId: datos.categoriaId ?? null,
      monto: null,
      modoReparto: 'igual',
      pagadoPor: null,
      estado: 'por_pagar',
      fecha: datos.fecha ?? hoyDe(ahora),
      venceEn: datos.venceEn ?? null,
      recurrencia: datos.recurrencia ?? 'ninguna',
      pagadaEn: null,
      liquidadaEn: null,
      contraparte: null,
      direccion: null,
      abonado: 0,
      plazoMeses: null,
      numeroCuota: null,
      planId: null,
      montoPlan: null,
      archivada: false,
      color: datos.color ?? 'amarillo',
      pinColor: datos.pinColor ?? 'rojo',
      posX: datos.posX ?? 40,
      posY: datos.posY ?? 40,
      rotacion: datos.rotacion ?? rotacionAlAzar(),
      z,
      partes: [],
    });
    if (tipo === 'recordatorio') return nota;

    nota.monto = Nota.#montoValido(datos.monto);
    const conPlazo = datos.plazoMeses ? nota.#aplicarPlazo(validarPlazo(datos.plazoMeses), datos) : datos;
    if (datos.contraparte !== undefined || datos.direccion !== undefined) nota.#comoDeudaExterna(conPlazo, tablero, ahora);
    else if (tablero.esPersonal()) nota.#comoGastoPersonal(conPlazo, autorId, ahora);
    else nota.#comoGastoCompartido(conPlazo, autorId, miembrosIds, ahora);
    return nota;
  }

  // ---------- consultas ----------

  esRecordatorio() {
    return this.tipo === 'recordatorio';
  }

  esDeudaExterna() {
    return this.contraparte != null;
  }

  /** Una mensualidad de una compra a meses (hay una nota por mensualidad). */
  esCuotaDePlan() {
    return this.planId != null;
  }

  /** Préstamo que se paga en N mensualidades (una sola nota). */
  esDeudaAMeses() {
    return this.tipo === 'prestamo' && this.plazoMeses != null;
  }

  estaPorPagar() {
    return this.estado === 'por_pagar';
  }

  /** ¿Mueve el balance entre miembros? */
  afectaBalance() {
    return !this.esRecordatorio() && !this.esDeudaExterna() && !this.estaPorPagar();
  }

  restante() {
    return aPesos(aCentavos(this.monto ?? 0) - aCentavos(this.abonado ?? 0));
  }

  puedeEditarla(miembro) {
    return this.creadoPor === miembro.usuarioId || miembro.tieneRango('admin');
  }

  /** Se archiva lo que ya no tiene nada pendiente: pagada sin deudas abiertas, liquidada o recordatorio hecho. */
  puedeArchivarse() {
    if (this.estado === 'liquidada') return true;
    if (this.estaPorPagar() || this.esRecordatorio() || this.esDeudaExterna()) return false;
    return this.partes.every((p) => p.liquidada || p.usuarioId === this.pagadoPor);
  }

  archivar() {
    if (!this.puedeArchivarse())
      throw new ReglaDeNegocioError('NO_ARCHIVABLE', 'Solo se archivan notas sin nada pendiente (pagadas y saldadas)');
    this.archivada = true;
  }

  desarchivar() {
    this.archivada = false;
  }

  // ---------- comportamiento ----------

  /**
   * Cambia contenido y/o dinero. Devuelve si cambió el dinero (para recalcular liquidaciones).
   * @returns {{ tocaDinero: boolean }}
   */
  editar(cambios, { tablero, miembrosIds }) {
    const pide = (campos) => campos.filter((c) => cambios[c] !== undefined);
    const dinero = pide(CAMPOS_DINERO);
    const externa = pide(['contraparte', 'direccion']);

    if (this.esRecordatorio() && (dinero.length || externa.length)) throw regla('RECORDATORIO_SIN_DINERO', 'Un recordatorio no lleva dinero');
    if (cambios.titulo !== undefined) this.titulo = Nota.#tituloValido(cambios.titulo);
    for (const c of pide(CAMPOS_LIBRES)) this[c] = cambios[c];
    if (cambios.plazoMeses !== undefined) this.#cambiarPlazo(cambios.plazoMeses);
    if (this.esCuotaDePlan() && cambios.monto !== undefined)
      throw regla('MENSUALIDAD_FIJA', 'El monto de una mensualidad sale del total de la compra; no se edita');

    if (this.esDeudaExterna()) {
      const noAplican = dinero.filter((c) => c !== 'monto');
      if (noAplican.length) throw regla('CAMPO_NO_APLICA', `En una deuda externa no aplica: ${noAplican.join(', ')}`);
      if (!pide(CAMPOS_EXTERNA).length) return { tocaDinero: false };
      this.#editarDeudaExterna(cambios);
      return { tocaDinero: true };
    }
    if (externa.length) throw regla('SOLO_DEUDA_EXTERNA', 'contraparte y direccion solo aplican a deudas externas');
    if (!dinero.length) return { tocaDinero: false };

    if (cambios.pagadoPor !== undefined && this.estaPorPagar())
      throw regla('USA_PAGAR', 'Esta nota está por pagar; registra quién la pagó con la acción "pagar"');
    if (cambios.pagadoPor === null) throw regla('PAGADOR_REQUERIDO', 'Una nota pagada necesita quién la pagó');
    if (cambios.monto !== undefined) this.monto = Nota.#montoValido(cambios.monto);
    if (cambios.modoReparto !== undefined) this.modoReparto = cambios.modoReparto;

    if (tablero.esPersonal()) {
      if (cambios.participantes || (cambios.pagadoPor && cambios.pagadoPor !== this.creadoPor))
        throw regla('SOLO_TABLERO_COMPARTIDO', 'En un tablero personal no se reparte entre personas');
      this.#asignarPartes([{ usuarioId: this.creadoPor }], miembrosIds);
    } else {
      if (cambios.pagadoPor) this.pagadoPor = Nota.#exigirMiembros([cambios.pagadoPor], miembrosIds)[0];
      this.#asignarPartes(cambios.participantes ?? this.#participantesActuales(), miembrosIds);
    }
    this.aplicarPagos(new Map());
    return { tocaDinero: true };
  }

  mover({ posX, posY, rotacion }, zAlFrente) {
    this.posX = posX;
    this.posY = posY;
    if (rotacion !== undefined) this.rotacion = rotacion;
    if (zAlFrente !== undefined) this.z = zAlFrente;
  }

  /**
   * Alguien pagó el recibo (luz, internet...). En un recordatorio: se marca hecho.
   * Si es recurrente, devuelve la nota del siguiente periodo (por pagar).
   * @returns {Nota|null}
   */
  pagar({ pagadoPor, fecha, miembrosIds, ahora = new Date() }) {
    if (!this.estaPorPagar()) throw new EstadoInvalidoError('YA_PAGADA', 'Esta nota ya está pagada');
    const fechaDelCargo = this.fecha;
    this.pagadaEn = ahora;
    if (this.esRecordatorio()) {
      this.estado = 'liquidada';
      this.liquidadaEn = ahora;
    } else {
      this.pagadoPor = Nota.#exigirMiembros([pagadoPor], miembrosIds)[0];
      this.estado = 'pagada';
      this.fecha = fecha ?? hoyDe(ahora);
      this.aplicarPagos(new Map());
    }
    if (this.esCuotaDePlan()) return this.numeroCuota < this.plazoMeses ? this.#siguienteMensualidad(fechaDelCargo) : null;
    return this.recurrencia === 'ninguna' ? null : this.#siguientePeriodo(fechaDelCargo);
  }

  /** Abono a una deuda externa ("ya le di $200 a Juan"). */
  abonar(monto, ahora = new Date()) {
    if (!this.esDeudaExterna()) throw regla('SOLO_DEUDA_EXTERNA', 'Los abonos son para deudas con gente de fuera; entre miembros usa pagos');
    if (this.estado === 'liquidada') throw new EstadoInvalidoError('YA_LIQUIDADA', 'Esta deuda ya está liquidada');
    const m = Nota.#montoValido(monto);
    if (aCentavos(m) > aCentavos(this.restante())) throw regla('ABONO_EXCEDE', `Solo faltan ${this.restante()}`);
    this.abonado = sumar(this.abonado, m);
    this.#liquidarSiNoFalta(ahora);
    return m;
  }

  /**
   * Marca liquidadas las partes ya cubiertas con pagos confirmados ligados a esta nota.
   * @param {Map<string, number>} pagadoPorUsuario  usuarioId → total pagado a quien pagó la nota
   */
  aplicarPagos(pagadoPorUsuario, ahora = new Date()) {
    if (this.esRecordatorio() || this.esDeudaExterna() || this.estaPorPagar()) return;
    for (const p of this.partes) {
      p.liquidada = p.usuarioId === this.pagadoPor || aCentavos(pagadoPorUsuario.get(p.usuarioId) ?? 0) >= aCentavos(p.monto);
    }
    const deudoras = this.partes.filter((p) => p.usuarioId !== this.pagadoPor);
    this.abonado = sumar(...deudoras.map((p) => Math.min(pagadoPorUsuario.get(p.usuarioId) ?? 0, p.monto)));
    const saldada = deudoras.length > 0 && deudoras.every((p) => p.liquidada);
    this.estado = saldada ? 'liquidada' : 'pagada';
    this.liquidadaEn = saldada ? (this.liquidadaEn ?? ahora) : null;
  }

  // ---------- privados ----------

  static #tituloValido(titulo) {
    const limpio = String(titulo ?? '').trim();
    if (!limpio || limpio.length > 120) throw regla('TITULO_INVALIDO', 'El título debe tener de 1 a 120 caracteres');
    return limpio;
  }

  static #montoValido(monto) {
    const n = Number(monto);
    if (!Number.isFinite(n) || n <= 0) throw regla('MONTO_INVALIDO', 'El monto debe ser mayor a cero');
    if (aCentavos(n) / 100 !== n) throw regla('MONTO_INVALIDO', 'El monto admite máximo 2 decimales');
    return n;
  }

  static #exigirMiembros(ids, miembrosIds) {
    const fuera = ids.filter((id) => !miembrosIds.includes(id));
    if (fuera.length) throw regla('NO_ES_MIEMBRO', 'Hay personas que no son miembros del tablero', fuera.map((usuarioId) => ({ usuarioId })));
    return ids;
  }

  #comoDeudaExterna({ contraparte, direccion }, tablero, ahora) {
    if (!tablero.esPersonal()) throw regla('SOLO_TABLERO_PERSONAL', 'Las deudas con gente de fuera van en un tablero personal');
    if (this.tipo !== 'prestamo') throw regla('TIPO_INVALIDO', 'Una deuda con alguien de fuera es de tipo préstamo');
    this.#editarDeudaExterna({ contraparte, direccion }, { requerido: true });
    this.estado = 'pagada';
    this.pagadaEn = ahora;
  }

  #editarDeudaExterna({ monto, contraparte, direccion }, { requerido = false } = {}) {
    if (contraparte !== undefined || requerido) {
      const nombre = String(contraparte ?? '').trim();
      if (!nombre || nombre.length > 80) throw regla('CONTRAPARTE_REQUERIDA', '¿Con quién es la deuda? (contraparte, 1 a 80 caracteres)');
      this.contraparte = nombre;
    }
    if (direccion !== undefined || requerido) {
      if (!DIRECCIONES.includes(direccion)) throw regla('DIRECCION_INVALIDA', 'direccion debe ser "debo" o "me_deben"');
      this.direccion = direccion;
    }
    if (monto !== undefined) {
      this.monto = Nota.#montoValido(monto);
      if (aCentavos(this.monto) < aCentavos(this.abonado)) throw regla('MONTO_MENOR_A_ABONADO', `Ya se abonaron ${this.abonado}`);
      this.estado = 'pagada';
      this.liquidadaEn = null;
      this.#liquidarSiNoFalta(new Date());
    }
  }

  #liquidarSiNoFalta(ahora) {
    if (aCentavos(this.restante()) === 0) {
      this.estado = 'liquidada';
      this.liquidadaEn = ahora;
    }
  }

  #comoGastoPersonal(datos, autorId, ahora) {
    if (this.tipo === 'prestamo') throw regla('CONTRAPARTE_REQUERIDA', 'En un tablero personal un préstamo necesita contraparte y direccion');
    if (datos.participantes || (datos.pagadoPor && datos.pagadoPor !== autorId))
      throw regla('SOLO_TABLERO_COMPARTIDO', 'En un tablero personal no se reparte entre personas');
    this.#fijarEstadoInicial(datos, autorId, ahora);
    this.#asignarPartes([{ usuarioId: autorId }], [autorId]);
  }

  #comoGastoCompartido(datos, autorId, miembrosIds, ahora) {
    this.modoReparto = datos.modoReparto ?? 'igual';
    this.#fijarEstadoInicial(datos, autorId, ahora);
    if (this.pagadoPor) Nota.#exigirMiembros([this.pagadoPor], miembrosIds);
    this.#asignarPartes(datos.participantes ?? miembrosIds.map((usuarioId) => ({ usuarioId })), miembrosIds);
  }

  /** Un servicio sin pagador nace "por pagar"; lo demás, pagado por quien lo indica (o el autor). */
  #fijarEstadoInicial(datos, autorId, ahora) {
    this.estado = datos.estado ?? (this.tipo === 'servicio' && !datos.pagadoPor ? 'por_pagar' : 'pagada');
    if (this.estado === 'pagada') {
      this.pagadoPor = datos.pagadoPor ?? autorId;
      this.pagadaEn = ahora;
    }
  }

  #asignarPartes(participantes, miembrosIds) {
    const partes = repartir(this.monto, this.modoReparto, participantes);
    Nota.#exigirMiembros(partes.map((p) => p.usuarioId), miembrosIds);
    this.partes = partes.map((p) => ({ ...p, liquidada: false }));
    this.aplicarPagos(new Map());
  }

  #participantesActuales() {
    if (this.modoReparto === 'montos') {
      const suma = sumar(...this.partes.map((p) => p.monto));
      if (aCentavos(suma) !== aCentavos(this.monto))
        throw regla('PARTICIPANTES_REQUERIDOS', 'Al cambiar el monto con reparto por montos, manda los participantes');
    }
    return this.partes.map(({ usuarioId, monto, porcentaje, proporcion }) => ({ usuarioId, monto, porcentaje, proporcion }));
  }

  /**
   * Con plazo: un préstamo queda como deuda a meses (una nota); un gasto o servicio
   * se vuelve compra a meses: esta nota es la mensualidad 1 y el total se guarda en montoPlan.
   * Devuelve los datos con los que se sigue armando la nota.
   */
  #aplicarPlazo(meses, datos) {
    if (this.tipo === 'prestamo') {
      this.plazoMeses = meses;
      this.venceEn ??= siguienteFecha(this.fecha, 'mensual');
      return datos;
    }
    this.plazoMeses = meses;
    this.montoPlan = this.monto;
    this.numeroCuota = 1;
    this.planId = crypto.randomUUID();
    this.monto = mensualidad(this.montoPlan, meses, 1);
    this.recurrencia = 'mensual';
    this.venceEn ??= this.fecha;
    // La primera mensualidad normalmente está por pagar (salvo que digan que ya se pagó)
    return { ...datos, estado: datos.estado ?? (datos.pagadoPor ? 'pagada' : 'por_pagar') };
  }

  #cambiarPlazo(meses) {
    if (this.tipo !== 'prestamo' || this.esCuotaDePlan())
      throw regla('PLAZO_SOLO_PRESTAMO', 'El plazo solo se cambia en préstamos; una compra a meses se define al crearla');
    this.plazoMeses = meses === null ? null : validarPlazo(meses);
  }

  /** La mensualidad k+1 de una compra a meses, con el reparto en la misma proporción. */
  #siguienteMensualidad(fechaDelCargo) {
    const k = this.numeroCuota + 1;
    const monto = mensualidad(this.montoPlan, this.plazoMeses, k);
    const nueva = this.#siguientePeriodo(fechaDelCargo);
    nueva.monto = monto;
    nueva.numeroCuota = k;
    const proporcional = repartir(monto, 'proporcion', this.partes.map((p) => ({ usuarioId: p.usuarioId, proporcion: p.monto })));
    nueva.partes = this.partes.map((p, i) => ({ ...p, monto: proporcional[i].monto, liquidada: false }));
    return nueva;
  }

  #siguientePeriodo(fechaDelCargo) {
    return new Nota({
      ...this,
      id: undefined,
      estado: 'por_pagar',
      pagadoPor: null,
      abonado: 0,
      pagadaEn: null,
      liquidadaEn: null,
      creadoEn: undefined,
      actualizadoEn: undefined,
      fecha: siguienteFecha(fechaDelCargo, this.recurrencia),
      venceEn: siguienteFecha(this.venceEn, this.recurrencia),
      posX: this.posX + 24,
      posY: this.posY + 24,
      rotacion: rotacionAlAzar(),
      partes: this.partes.map((p) => ({ ...p, liquidada: false })),
    });
  }
}
