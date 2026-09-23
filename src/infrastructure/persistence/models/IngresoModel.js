import { BaseModel } from '../BaseModel.js';

export class IngresoModel extends BaseModel {
  static tabla = 'ingresos';
  static columnas = ['id', 'tableroId', 'creadoPor', 'concepto', 'monto', 'fecha', 'recurrente', 'creadoEn'];
  static ordenables = ['fecha', 'creadoEn'];
  static ordenDefault = '-fecha';
}
