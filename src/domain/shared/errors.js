/**
 * Errores del dominio. No saben nada de HTTP: la capa de presentación decide
 * qué código de estado le corresponde a cada uno.
 */
export class DomainError extends Error {
  constructor(codigo, mensaje, detalles = []) {
    super(mensaje);
    this.name = new.target.name;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

/** Se violó una regla de negocio (monto inválido, reparto que no cuadra...). */
export class ReglaDeNegocioError extends DomainError {}

/** La persona no tiene permiso para esta acción sobre este objeto. */
export class PermisoDenegadoError extends DomainError {
  constructor(mensaje, detalles = []) {
    super('PERMISO_DENEGADO', mensaje, detalles);
  }
}

/** La acción no aplica en el estado actual (ya pagada, ya confirmada...). */
export class EstadoInvalidoError extends DomainError {}

/** Algo que existió pero ya no está vigente (invitación vencida). */
export class NoVigenteError extends DomainError {}
