import { BaseModel } from '../BaseModel.js';

export class PresupuestoModel extends BaseModel {
  static tabla = 'presupuestos';
  static columnas = ['id', 'tableroId', 'categoriaId', 'montoMensual', 'creadoEn', 'actualizadoEn'];
}
