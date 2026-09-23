import { ApiResponse } from './ApiResponse.js';
import {
  ReglaDeNegocioError,
  PermisoDenegadoError,
  EstadoInvalidoError,
  NoVigenteError,
} from '../../domain/shared/errors.js';
import { NoEncontradoError, NoAutenticadoError, ConflictoError } from '../../application/shared/errors.js';
import { AlmacenNoConfiguradoError } from '../../application/use-cases/archivos/FirmarSubida.js';

/** El cuerpo, la query o los parámetros no tienen la forma esperada. */
export class DatosInvalidosError extends Error {
  constructor(detalles) {
    super('Datos inválidos');
    this.codigo = 'DATOS_INVALIDOS';
    this.detalles = detalles;
  }
}

/** Traducción de errores de dominio/aplicación a HTTP. El orden importa (el primero que coincide gana). */
const ESTADOS = [
  [DatosInvalidosError, 400],
  [NoAutenticadoError, 401],
  [PermisoDenegadoError, 403],
  [NoEncontradoError, 404],
  [ConflictoError, 409],
  [EstadoInvalidoError, 409],
  [NoVigenteError, 410],
  [ReglaDeNegocioError, 422],
  [AlmacenNoConfiguradoError, 503],
];

/** Errores de Postgres que se escapan de las validaciones (carreras, etc.). */
const POSTGRES = {
  23505: [409, 'DUPLICADO', 'Ya existe un registro igual'],
  23503: [422, 'REFERENCIA_INVALIDA', 'Referencia a un registro que no existe'],
  23514: [422, 'RESTRICCION', 'Valor fuera de lo permitido'],
  '22P02': [400, 'FORMATO_INVALIDO', 'Formato de dato inválido'],
};

export const rutaNoEncontrada = (req, res) =>
  ApiResponse.error(res, 404, 'RUTA_NO_ENCONTRADA', `No existe ${req.method} ${req.path}`);

// eslint-disable-next-line no-unused-vars
export const manejarErrores = (err, _req, res, _next) => {
  const conocido = ESTADOS.find(([Clase]) => err instanceof Clase);
  if (conocido) return ApiResponse.error(res, conocido[1], err.codigo, err.message, err.detalles);
  if (err?.type === 'entity.parse.failed') return ApiResponse.error(res, 400, 'JSON_INVALIDO', 'El cuerpo no es JSON válido');
  if (POSTGRES[err?.code]) return ApiResponse.error(res, ...POSTGRES[err.code]);
  console.error(err);
  return ApiResponse.error(res, 500, 'ERROR_INTERNO', 'Error interno');
};
