import { BaseModel } from '../BaseModel.js';

export class TableroModel extends BaseModel {
  static tabla = 'tableros';
  static columnas = ['id', 'nombre', 'descripcion', 'moneda', 'fondo', 'tipo', 'propietarioId', 'archivado', 'creadoEn', 'actualizadoEn'];
  static ordenables = ['creadoEn', 'actualizadoEn', 'nombre'];
}
