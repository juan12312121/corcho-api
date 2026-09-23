import { BaseModel } from '../BaseModel.js';

export class AbonoModel extends BaseModel {
  static tabla = 'abonos';
  static columnas = ['id', 'notaId', 'monto', 'registradoPor', 'fecha', 'creadoEn'];
}
