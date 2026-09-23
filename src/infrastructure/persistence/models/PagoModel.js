import { BaseModel } from '../BaseModel.js';

export class PagoModel extends BaseModel {
  static tabla = 'pagos';
  static columnas = [
    'id', 'tableroId', 'deUsuarioId', 'aUsuarioId', 'monto', 'notaId', 'concepto', 'metodo',
    'estado', 'registradoPor', 'fecha', 'confirmadoEn', 'stripeSesionId', 'creadoEn', 'actualizadoEn',
  ];
  static ordenables = ['creadoEn', 'fecha', 'monto'];
}
