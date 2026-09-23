import jwt from 'jsonwebtoken';
import { TokenService } from '../../application/ports/TokenService.js';
import { NoAutenticadoError } from '../../application/shared/errors.js';

export class JwtTokenService extends TokenService {
  constructor({ secreto, expira }) {
    super();
    this.secreto = secreto;
    this.expira = expira;
  }

  firmar(usuario) {
    return jwt.sign({ id: usuario.id, email: usuario.email }, this.secreto, { expiresIn: this.expira });
  }

  verificar(token) {
    try {
      const { id, email } = jwt.verify(token, this.secreto);
      return { id, email };
    } catch {
      throw new NoAutenticadoError('Token inválido o vencido');
    }
  }
}
