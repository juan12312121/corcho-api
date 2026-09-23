import { ApplicationError } from '../shared/errors.js';

/**
 * Puerto: cobrar con tarjeta a nombre de un miembro (el dinero va a SU cuenta, nunca
 * se queda en Corcho). Lo implementa Stripe Connect; los casos de uso no lo saben.
 */
export class PasarelaPagos {
  estaConfigurada() {
    return false;
  }

  /** Crea la cuenta de cobro de una persona. @returns {Promise<string>} id de la cuenta */
  async crearCuenta(_datos) {
    throw new Error('PasarelaPagos.crearCuenta() no está implementado');
  }

  /** Enlace para que la persona termine su alta (datos y cuenta bancaria). */
  async enlaceAlta(_cuentaId, _urls) {
    throw new Error('PasarelaPagos.enlaceAlta() no está implementado');
  }

  /** Enlace a su panel (ver cobros y depósitos). */
  async enlacePanel(_cuentaId) {
    throw new Error('PasarelaPagos.enlacePanel() no está implementado');
  }

  /** @returns {Promise<{ listo: boolean }>} si ya puede recibir pagos */
  async estadoCuenta(_cuentaId) {
    throw new Error('PasarelaPagos.estadoCuenta() no está implementado');
  }

  /**
   * Página de pago: cobra monto + comisión y le transfiere `monto` exacto a la cuenta destino.
   * @returns {Promise<{ id: string, url: string }>}
   */
  async crearCobro(_datos) {
    throw new Error('PasarelaPagos.crearCobro() no está implementado');
  }

  /** @returns {Promise<{ id: string, pagado: boolean, datos: Record<string, string> }>} */
  async obtenerCobro(_id) {
    throw new Error('PasarelaPagos.obtenerCobro() no está implementado');
  }

  /** Verifica la firma de un aviso (webhook) y lo devuelve interpretado. Lanza si la firma no cuadra. */
  verificarAviso(_cuerpo, _firma) {
    throw new Error('PasarelaPagos.verificarAviso() no está implementado');
  }
}

/** La pasarela no tiene llaves en el servidor. */
export class PasarelaNoConfiguradaError extends ApplicationError {
  constructor() {
    super('PAGOS_CON_TARJETA_APAGADOS', 'Los pagos con tarjeta no están configurados en el servidor');
  }
}

/** Stripe rechazó la operación (el mensaje es para la persona). */
export class PasarelaError extends ApplicationError {
  constructor(mensaje) {
    super('PASARELA_RECHAZO', mensaje);
  }
}
