import { BaseEntity } from '../shared/BaseEntity.js';
import { ReglaDeNegocioError } from '../shared/errors.js';
import { bancoDeClabe, esClabeValida } from '../shared/Clabe.js';

const COLORES = ['#F7B500', '#E4007C', '#1E4FA3', '#2E9E5B', '#F26B21', '#7B3FA0', '#00A6A6', '#C0392B'];
const LADA_MEXICO = '52';

const regla = (codigo, mensaje) => new ReglaDeNegocioError(codigo, mensaje);

export class Usuario extends BaseEntity {
  static privados = ['passwordHash'];

  /** @param {{ nombre: string, email: string, passwordHash: string, color?: string }} datos */
  static registrar({ nombre, email, passwordHash, color }) {
    return new Usuario({
      nombre: Usuario.#nombreValido(nombre),
      email: email.trim().toLowerCase(),
      passwordHash,
      color: color ?? COLORES[Math.floor(Math.random() * COLORES.length)],
      avatarUrl: null,
      telefono: null,
      avisosWhatsapp: false,
      clabe: null,
      banco: null,
      titularCuenta: null,
    });
  }

  static #nombreValido(nombre) {
    const limpio = String(nombre ?? '').trim();
    if (!limpio || limpio.length > 80) throw regla('NOMBRE_INVALIDO', 'El nombre debe tener de 1 a 80 caracteres');
    return limpio;
  }

  /** 10 dígitos → se le antepone la lada de México (52). Acepta espacios, guiones y "+". */
  static #telefonoValido(telefono) {
    if (telefono === null || telefono === '') return null;
    const digitos = String(telefono).replace(/[^0-9]/g, '');
    const completo = digitos.length === 10 ? LADA_MEXICO + digitos : digitos;
    if (completo.length < 12 || completo.length > 15) throw regla('TELEFONO_INVALIDO', 'Escribe tu celular a 10 dígitos (o con lada internacional)');
    return completo;
  }

  actualizarPerfil({ nombre, color, avatarUrl, telefono, avisosWhatsapp }) {
    if (nombre !== undefined) this.nombre = Usuario.#nombreValido(nombre);
    if (color !== undefined) this.color = color;
    if (avatarUrl !== undefined) this.avatarUrl = avatarUrl;
    if (telefono !== undefined) this.telefono = Usuario.#telefonoValido(telefono);
    if (avisosWhatsapp !== undefined) this.avisosWhatsapp = avisosWhatsapp;
    if (this.avisosWhatsapp && !this.telefono) throw regla('TELEFONO_REQUERIDO', 'Para recibir avisos por WhatsApp agrega tu celular');
  }

  /** Datos para que los demás miembros te puedan transferir. null borra la CLABE. */
  cambiarDatosPago({ clabe, banco, titularCuenta }) {
    if (clabe !== undefined) {
      const limpia = clabe === null ? null : String(clabe).replace(/\s/g, '');
      if (limpia !== null && !esClabeValida(limpia)) throw regla('CLABE_INVALIDA', 'La CLABE no es válida (revisa los 18 dígitos)');
      this.clabe = limpia;
      if (limpia && banco === undefined) this.banco = bancoDeClabe(limpia) ?? this.banco;
    }
    if (banco !== undefined) this.banco = banco?.trim() || null;
    // Sin banco escrito, se deduce de la CLABE
    if (!this.banco && this.clabe) this.banco = bancoDeClabe(this.clabe) ?? null;
    if (titularCuenta !== undefined) this.titularCuenta = titularCuenta?.trim() || null;
  }

  cambiarPassword(passwordHash) {
    this.passwordHash = passwordHash;
  }

  quiereAvisosWhatsapp() {
    return this.avisosWhatsapp && Boolean(this.telefono);
  }
}
