import { BaseModel } from '../BaseModel.js';

export class MetaAporteModel extends BaseModel {
  static tabla = 'meta_aportes';
  static columnas = ['id', 'metaId', 'usuarioId', 'monto', 'fecha', 'creadoEn'];
}
