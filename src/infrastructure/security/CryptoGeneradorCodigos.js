import crypto from 'node:crypto';
import { GeneradorCodigos } from '../../application/ports/GeneradorCodigos.js';

/** Sin caracteres que se confunden al dictarlos (0/O, 1/l/I). */
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

export class CryptoGeneradorCodigos extends GeneradorCodigos {
  constructor(largo = 10) {
    super();
    this.largo = largo;
  }

  nuevo() {
    return [...crypto.randomBytes(this.largo)].map((b) => ALFABETO[b % ALFABETO.length]).join('');
  }
}
