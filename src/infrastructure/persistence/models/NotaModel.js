import { BaseModel } from '../BaseModel.js';

export class NotaModel extends BaseModel {
  static tabla = 'notas';
  static columnas = [
    'id', 'tableroId', 'creadoPor', 'tipo', 'titulo', 'descripcion', 'categoriaId', 'monto', 'modoReparto', 'pagadoPor',
    'estado', 'fecha', 'venceEn', 'recurrencia', 'pagadaEn', 'liquidadaEn', 'contraparte', 'direccion', 'abonado', 'plazoMeses', 'numeroCuota', 'planId', 'montoPlan', 'archivada',
    'monedaOriginal', 'montoOriginal', 'tipoCambio',
    'color', 'pinColor', 'posX', 'posY', 'rotacion', 'z', 'creadoEn', 'actualizadoEn',
  ];
  static ordenables = ['creadoEn', 'actualizadoEn', 'fecha', 'venceEn', 'monto', 'z'];
}
