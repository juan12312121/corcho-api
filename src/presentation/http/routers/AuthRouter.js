import { BaseRouter } from '../BaseRouter.js';
import { limiteAuth } from '../middlewares.js';

/** /auth — /registro y /login son públicas; /yo necesita sesión. */
export class AuthRouter extends BaseRouter {
  constructor(controller, { conSesion }) {
    super(controller);
    this.conSesion = conSesion;
  }

  rutas() {
    this.post('/registro', limiteAuth, 'registrar');
    this.post('/login', limiteAuth, 'iniciarSesion');
    this.get('/yo', this.conSesion, 'perfil');
    this.patch('/yo', this.conSesion, 'editarPerfil');
    this.post('/yo/foto/firma', this.conSesion, 'firmarFoto');
    this.post('/recuperar', limiteAuth, 'solicitarRecuperacion');
    this.post('/restablecer', limiteAuth, 'restablecer');
  }
}
