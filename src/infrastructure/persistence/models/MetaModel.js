import { BaseModel } from '../BaseModel.js';

export class MetaModel extends BaseModel {
  static tabla = 'metas';
  static columnas = ['id', 'tableroId', 'creadoPor', 'nombre', 'objetivo', 'fechaLimite', 'color', 'creadoEn', 'actualizadoEn'];
}
