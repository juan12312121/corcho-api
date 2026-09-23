import crypto from 'node:crypto';
import { GeneradorTokens } from '../../application/ports/GeneradorTokens.js';

/** 32 bytes aleatorios en base64url; en la base solo se guarda su SHA-256. */
export class CryptoGeneradorTokens extends GeneradorTokens {
  nuevo() {
    const token = crypto.randomBytes(32).toString('base64url');
    return { token, hash: this.hash(token) };
  }

  hash(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
