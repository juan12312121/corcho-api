import { BaseController } from '../BaseController.js';
import * as esquemas from '../esquemas/auth.js';

export class AuthController extends BaseController {
  registrar = this.accion('registrarUsuario', { body: esquemas.registro, status: 201 });
  iniciarSesion = this.accion('iniciarSesion', { body: esquemas.login });
  perfil = this.accion('obtenerPerfil');
  editarPerfil = this.accion('actualizarPerfil', { body: esquemas.perfil });
  firmarFoto = this.accion('firmarSubida');
  solicitarRecuperacion = this.accion('solicitarRecuperacion', { body: esquemas.recuperar, status: 204 });
  restablecer = this.accion('restablecerPassword', { body: esquemas.restablecer });
  // Cobrar con tarjeta (Stripe Connect)
  estadoCobros = this.accion('estadoCobros');
  conectarCobros = this.accion('conectarCobros');
}
