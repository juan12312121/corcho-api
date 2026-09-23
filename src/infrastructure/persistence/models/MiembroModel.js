import { BaseModel } from '../BaseModel.js';

export class MiembroModel extends BaseModel {
  static tabla = 'tablero_miembros';
  static columnas = ['id', 'tableroId', 'usuarioId', 'rol', 'apodo', 'unidoEn', 'creadoEn'];
  static ordenables = ['unidoEn'];
  static ordenDefault = 'unidoEn';
}
