/** Puerto: tokens secretos de un solo uso; solo su hash se guarda. */
export class GeneradorTokens {
  /** @returns {{ token: string, hash: string }} */
  nuevo() {
    throw new Error('GeneradorTokens.nuevo() no está implementado');
  }

  /** @returns {string} */
  hash(_token) {
    throw new Error('GeneradorTokens.hash() no está implementado');
  }
}
