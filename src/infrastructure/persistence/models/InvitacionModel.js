import { BaseModel } from '../BaseModel.js';

export class InvitacionModel extends BaseModel {
  static tabla = 'invitaciones';
  static columnas = ['id', 'tableroId', 'invitadoPor', 'email', 'codigo', 'rol', 'estado', 'usosMax', 'usos', 'expiraEn', 'creadoEn'];
}
