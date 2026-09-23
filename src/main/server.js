import http from 'node:http';
import { crearContenedor } from './container.js';
import { crearApp } from '../presentation/http/crearApp.js';
import { SocketServer } from '../presentation/realtime/SocketServer.js';

const contenedor = crearContenedor();
const app = crearApp({ rutas: contenedor.rutas, corsOrigen: contenedor.config.CORS_ORIGEN });
const servidor = http.createServer(app);
new SocketServer(servidor, contenedor.tiempoReal);

servidor.on('error', (e) => {
  if (e.code === 'EADDRINUSE') console.error(`El puerto ${contenedor.config.PORT} ya está ocupado (¿otro servidor corriendo?). Cambia PORT en .env o ciérralo.`);
  else console.error(e);
  process.exit(1);
});
servidor.listen(contenedor.config.PORT, () => console.log(`Corcho API en http://localhost:${contenedor.config.PORT}`));

async function apagar() {
  servidor.close();
  await contenedor.cerrar().catch(() => {});
  process.exit(0);
}
process.on('SIGINT', apagar);
process.on('SIGTERM', apagar);
