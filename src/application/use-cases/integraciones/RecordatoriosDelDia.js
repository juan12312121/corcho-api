import { UseCase } from '../../shared/UseCase.js';
import { recordatoriosDelDia } from '../../../domain/services/Recordatorios.js';
import { hoy, sumarDias } from '../../../domain/shared/Fechas.js';

/**
 * Para n8n (una vez al día): qué avisar por WhatsApp y a quién.
 * Solo incluye a quien activó "avisos por WhatsApp" y tiene celular en su perfil.
 */
export class RecordatoriosDelDia extends UseCase {
  constructor({ notas, tableros, miembros }) {
    super();
    this.notas = notas;
    this.tableros = tableros;
    this.miembros = miembros;
  }

  async ejecutar({ diasAntes = 1 }) {
    const fecha = sumarDias(hoy(), diasAntes);
    const notas = await this.notas.paraRecordatorios(fecha);
    const tableroIds = [...new Set(notas.map((n) => n.tableroId))];
    if (!tableroIds.length) return { fecha, avisos: [] };

    const [contactos, tableros] = await Promise.all([
      this.miembros.contactosParaAvisos(tableroIds),
      Promise.all(tableroIds.map((id) => this.tableros.porId(id))),
    ]);
    const porTablero = tableros.map((tablero) => ({
      tablero,
      notas: notas.filter((n) => n.tableroId === tablero.id),
      miembros: contactos.filter((c) => c.tableroId === tablero.id),
    }));
    return { fecha, avisos: recordatoriosDelDia(porTablero, { diasAntes }) };
  }
}
