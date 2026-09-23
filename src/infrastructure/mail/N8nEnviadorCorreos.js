import { EnviadorCorreos } from '../../application/ports/EnviadorCorreos.js';

const ESPERA_MAXIMA_MS = 15_000;

/**
 * El correo lo manda un flujo de n8n: aquí solo se le hace POST a su webhook con
 * { para, asunto, texto, html }. El token viaja en X-Correos-Token para que nadie
 * más pueda usar el webhook para mandar correos.
 */
export class N8nEnviadorCorreos extends EnviadorCorreos {
  constructor({ url, token }) {
    super();
    this.url = url;
    this.token = token;
  }

  async enviar({ para, asunto, texto, html }) {
    const respuesta = await fetch(this.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-correos-token': this.token },
      body: JSON.stringify({ para, asunto, texto, html }),
      signal: AbortSignal.timeout(ESPERA_MAXIMA_MS),
    });
    if (!respuesta.ok) throw new Error(`n8n no mandó el correo a ${para}: ${respuesta.status}`);
  }
}
