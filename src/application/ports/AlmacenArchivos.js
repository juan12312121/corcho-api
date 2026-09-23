/** Puerto: dónde viven las fotos. El navegador sube directo con una firma que da el servidor. */
export class AlmacenArchivos {
  /** @returns {{ url: string, campos: Record<string, string|number> }} datos para el POST de subida directa */
  firmarSubida(_carpeta) {
    throw new Error('AlmacenArchivos.firmarSubida() no está implementado');
  }

  /** Borra el archivo (si ya no existe, no truena). */
  async borrar(_publicId) {
    throw new Error('AlmacenArchivos.borrar() no está implementado');
  }

  /** @returns {boolean} */
  estaConfigurado() {
    throw new Error('AlmacenArchivos.estaConfigurado() no está implementado');
  }
}
