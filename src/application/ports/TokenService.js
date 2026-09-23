/** Puerto: sesiones firmadas. Un token lleva { id, email } del usuario. */
export class TokenService {
  /** @returns {string} */
  firmar(_usuario) {
    throw new Error('TokenService.firmar() no está implementado');
  }

  /** @returns {{ id: string, email: string }} o lanza NoAutenticadoError */
  verificar(_token) {
    throw new Error('TokenService.verificar() no está implementado');
  }
}
