import { BaseModel } from '../BaseModel.js';

export class AdjuntoModel extends BaseModel {
  static tabla = 'adjuntos';
  static columnas = ['id', 'tableroId', 'notaId', 'subidoPor', 'publicId', 'url', 'ancho', 'alto', 'formato', 'bytes', 'creadoEn'];
  static ordenDefault = 'creadoEn';
}
