import bcrypt from 'bcryptjs';
import { PasswordHasher } from '../../application/ports/PasswordHasher.js';

export class BcryptPasswordHasher extends PasswordHasher {
  constructor(rondas = 10) {
    super();
    this.rondas = rondas;
  }

  cifrar(texto) {
    return bcrypt.hash(texto, this.rondas);
  }

  coincide(texto, hash) {
    return bcrypt.compare(texto, hash);
  }
}
