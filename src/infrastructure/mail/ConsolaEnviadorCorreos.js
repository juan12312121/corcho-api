import { EnviadorCorreos } from '../../application/ports/EnviadorCorreos.js';

/** Sin n8n configurado (desarrollo): el correo se escribe en la consola del servidor. */
export class ConsolaEnviadorCorreos extends EnviadorCorreos {
  async enviar({ para, asunto, texto }) {
    console.log(`\n📧 [correo sin n8n] Para: ${para}\n   Asunto: ${asunto}\n   ${texto.replace(/\n/g, '\n   ')}\n`);
  }
}
