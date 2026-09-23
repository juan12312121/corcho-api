/** Los repositorios del dominio son contratos: la infraestructura los implementa. */
export const noImplementado = (clase, metodo) => {
  throw new Error(`${clase}.${metodo}() no está implementado`);
};
