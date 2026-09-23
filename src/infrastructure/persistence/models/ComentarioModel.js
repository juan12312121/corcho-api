import { BaseModel } from '../BaseModel.js';

export class ComentarioModel extends BaseModel {
  static tabla = 'comentarios';
  static columnas = ['id', 'tableroId', 'notaId', 'usuarioId', 'texto', 'menciones', 'creadoEn'];
  static ordenDefault = 'creadoEn';
}
