import { BaseModel } from '../BaseModel.js';

export class CategoriaModel extends BaseModel {
  static tabla = 'categorias';
  static columnas = ['id', 'tableroId', 'nombre', 'icono', 'color', 'creadoPor', 'creadoEn'];
  static ordenables = ['nombre', 'creadoEn'];
  static ordenDefault = 'nombre';
}
