import { BaseModel } from '../BaseModel.js';

export class NotaParteModel extends BaseModel {
  static tabla = 'nota_partes';
  static columnas = ['id', 'notaId', 'usuarioId', 'monto', 'porcentaje', 'proporcion', 'liquidada', 'creadoEn'];
}
