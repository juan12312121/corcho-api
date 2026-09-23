import { BaseModel } from '../BaseModel.js';

export class UsuarioModel extends BaseModel {
  static tabla = 'usuarios';
  static columnas = ['id', 'nombre', 'email', 'passwordHash', 'color', 'avatarUrl', 'telefono', 'avisosWhatsapp', 'clabe', 'banco', 'titularCuenta', 'ingresoMensual', 'stripeCuentaId', 'stripeListo', 'creadoEn', 'actualizadoEn'];
}
