import { BaseModel } from '../BaseModel.js';

export class ActividadModel extends BaseModel {
  static tabla = 'actividad';
  static columnas = ['id', 'tableroId', 'usuarioId', 'tipo', 'datos', 'creadoEn'];
}
