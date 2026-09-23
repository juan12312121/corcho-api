import { EnviadorCorreos } from '../../application/ports/EnviadorCorreos.js';

/**
 * Correo por SMTP (Gmail con contraseña de aplicación, Brevo, Mailgun...).
 * nodemailer se carga hasta el primer envío: sin SMTP configurado ni siquiera se importa.
 */
export class SmtpEnviadorCorreos extends EnviadorCorreos {
  constructor({ host, port, user, pass, remitente }) {
    super();
    this.config = { host, port, secure: port === 465, auth: { user, pass } };
    this.remitente = remitente;
    this.transporte = null;
  }

  async enviar({ para, asunto, texto, html }) {
    this.transporte ??= (await import('nodemailer')).default.createTransport(this.config);
    await this.transporte.sendMail({ from: this.remitente, to: para, subject: asunto, text: texto, html });
  }
}
