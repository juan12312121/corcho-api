import { UseCase } from '../../shared/UseCase.js';

const VIGENCIA_MS = 60 * 60 * 1000; // 1 hora

/**
 * "Olvidé mi contraseña": si el correo existe, manda un enlace de un solo uso.
 * Responde igual exista o no, para no revelar qué correos tienen cuenta.
 */
export class SolicitarRecuperacion extends UseCase {
  constructor({ usuarios, recuperaciones, tokensSeguros, correos, urlFrontend }) {
    super();
    this.usuarios = usuarios;
    this.recuperaciones = recuperaciones;
    this.tokensSeguros = tokensSeguros;
    this.correos = correos;
    this.urlFrontend = urlFrontend;
  }

  async ejecutar({ email }) {
    const usuario = await this.usuarios.porEmail(email);
    if (!usuario) return;

    const { token, hash } = this.tokensSeguros.nuevo();
    await this.recuperaciones.crear({ usuarioId: usuario.id, tokenHash: hash, expiraEn: new Date(Date.now() + VIGENCIA_MS) });

    const enlace = `${this.urlFrontend}/restablecer?token=${token}`;
    // Si el envío falla se registra pero se responde igual: un error delataría que la cuenta existe
    await this.correos.enviar({
      para: usuario.email,
      asunto: 'Restablece tu contraseña de Corcho',
      texto: `Hola ${usuario.nombre}:\n\nPara poner una contraseña nueva abre este enlace (vale 1 hora):\n${enlace}\n\nSi tú no lo pediste, ignora este correo.`,
      html: `<p>Hola ${escapar(usuario.nombre)}:</p><p>Para poner una contraseña nueva abre este enlace (vale 1 hora):</p><p><a href="${enlace}">Restablecer contraseña</a></p><p>Si tú no lo pediste, ignora este correo.</p>`,
    }).catch((e) => console.error('No se pudo mandar el correo de recuperación:', e.message));
  }
}

const escapar = (texto) => texto.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
