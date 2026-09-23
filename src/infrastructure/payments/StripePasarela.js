import crypto from 'node:crypto';
import { PasarelaPagos, PasarelaError } from '../../application/ports/PasarelaPagos.js';
import { aCentavos } from '../../domain/shared/Dinero.js';

const API = 'https://api.stripe.com/v1';
/** Un aviso con firma de más de 5 minutos se rechaza (evita que lo re-envíen) */
const TOLERANCIA_FIRMA_S = 300;

/** { a: { b: [ { c: 1 } ] } } → a[b][0][c]=1 (el formato que espera la API de Stripe). */
function aFormulario(datos, prefijo = '', params = new URLSearchParams()) {
  for (const [clave, valor] of Object.entries(datos)) {
    if (valor === undefined || valor === null) continue;
    const nombre = prefijo ? `${prefijo}[${clave}]` : clave;
    if (typeof valor === 'object') aFormulario(valor, nombre, params);
    else params.append(nombre, String(valor));
  }
  return params;
}

/**
 * Stripe Connect (cuentas Express) sin SDK:
 *  - cada persona tiene su cuenta de cobro; Corcho solo crea el cobro "a su nombre"
 *  - cargo con destino: se cobra monto + comisión y se le transfiere el monto exacto
 *  - los avisos (webhooks) se verifican con HMAC-SHA256, igual que el SDK oficial
 */
export class StripePasarela extends PasarelaPagos {
  constructor({ llaveSecreta, secretoAvisos }) {
    super();
    this.llaveSecreta = llaveSecreta;
    this.secretoAvisos = secretoAvisos;
  }

  estaConfigurada() {
    return Boolean(this.llaveSecreta);
  }

  async crearCuenta({ email, pais = 'MX' }) {
    const cuenta = await this.#pedir('POST', '/accounts', {
      type: 'express',
      country: pais,
      email,
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      business_type: 'individual',
      business_profile: { product_description: 'Cobros entre familia y amigos con Corcho' },
    });
    return cuenta.id;
  }

  async enlaceAlta(cuentaId, { volver, reintentar }) {
    const enlace = await this.#pedir('POST', '/account_links', { account: cuentaId, type: 'account_onboarding', return_url: volver, refresh_url: reintentar });
    return enlace.url;
  }

  async enlacePanel(cuentaId) {
    return (await this.#pedir('POST', `/accounts/${cuentaId}/login_links`, {})).url;
  }

  async estadoCuenta(cuentaId) {
    const cuenta = await this.#pedir('GET', `/accounts/${cuentaId}`);
    return { listo: Boolean(cuenta.charges_enabled && cuenta.details_submitted) };
  }

  async crearCobro({ monto, comision, moneda, destino, concepto, datos, exito, cancelar, email }) {
    const renglon = (nombre, pesos) => ({ quantity: 1, price_data: { currency: moneda.toLowerCase(), unit_amount: aCentavos(pesos), product_data: { name: nombre } } });
    const sesion = await this.#pedir('POST', '/checkout/sessions', {
      mode: 'payment',
      line_items: [renglon(concepto, monto), ...(comision > 0 ? [renglon('Comisión por pago con tarjeta', comision)] : [])],
      // A quien cobra le llega el monto exacto; la comisión cubre la tarifa de Stripe
      payment_intent_data: { transfer_data: { destination: destino, amount: aCentavos(monto) }, metadata: datos, description: concepto },
      metadata: datos,
      customer_email: email,
      success_url: exito,
      cancel_url: cancelar,
      locale: 'es',
    });
    return { id: sesion.id, url: sesion.url };
  }

  async obtenerCobro(id) {
    const sesion = await this.#pedir('GET', `/checkout/sessions/${encodeURIComponent(id)}`);
    return { id: sesion.id, pagado: sesion.payment_status === 'paid', datos: sesion.metadata ?? {} };
  }

  /** @returns {{ tipo: string, objeto: object }} */
  verificarAviso(cuerpo, firma) {
    if (!this.secretoAvisos) throw new Error('Falta STRIPE_WEBHOOK_SECRET');
    const partes = Object.fromEntries(String(firma ?? '').split(',').map((p) => p.split('=')));
    const marca = Number(partes.t);
    if (!marca || Math.abs(Date.now() / 1000 - marca) > TOLERANCIA_FIRMA_S) throw new Error('Firma vencida');
    const esperada = crypto.createHmac('sha256', this.secretoAvisos).update(`${marca}.${cuerpo}`).digest('hex');
    const firmas = String(firma).split(',').filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
    const valida = firmas.some((f) => f.length === esperada.length && crypto.timingSafeEqual(Buffer.from(f), Buffer.from(esperada)));
    if (!valida) throw new Error('Firma inválida');
    const evento = JSON.parse(cuerpo);
    return { tipo: evento.type, objeto: evento.data?.object ?? {} };
  }

  async #pedir(metodo, ruta, datos) {
    const respuesta = await fetch(API + ruta, {
      method: metodo,
      headers: { authorization: `Bearer ${this.llaveSecreta}`, 'content-type': 'application/x-www-form-urlencoded', 'stripe-version': '2024-06-20' },
      body: metodo === 'GET' ? undefined : aFormulario(datos ?? {}),
    });
    const json = await respuesta.json();
    if (!respuesta.ok) {
      throw new PasarelaError(json.error?.message ?? `Stripe respondió ${respuesta.status}`);
    }
    return json;
  }
}
