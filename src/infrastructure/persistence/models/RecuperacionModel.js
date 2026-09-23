import { BaseModel } from '../BaseModel.js';

export class RecuperacionModel extends BaseModel {
  static tabla = 'recuperaciones';
  static columnas = ['id', 'usuarioId', 'tokenHash', 'expiraEn', 'usadaEn', 'creadoEn'];
}
