import { RegistrarUsuario } from '../../application/use-cases/auth/RegistrarUsuario.js';
import { IniciarSesion } from '../../application/use-cases/auth/IniciarSesion.js';
import { ObtenerPerfil } from '../../application/use-cases/auth/ObtenerPerfil.js';
import { ActualizarPerfil } from '../../application/use-cases/auth/ActualizarPerfil.js';
import { CrearTablero } from '../../application/use-cases/tableros/CrearTablero.js';
import { ListarMisTableros } from '../../application/use-cases/tableros/ListarMisTableros.js';
import { ObtenerTablero } from '../../application/use-cases/tableros/ObtenerTablero.js';
import { ActualizarTablero } from '../../application/use-cases/tableros/ActualizarTablero.js';
import { BorrarTablero } from '../../application/use-cases/tableros/BorrarTablero.js';
import { CambiarTipoTablero } from '../../application/use-cases/tableros/CambiarTipoTablero.js';
import { VerificarAccesoEnVivo } from '../../application/use-cases/tableros/VerificarAccesoEnVivo.js';
import { ListarMiembros } from '../../application/use-cases/miembros/ListarMiembros.js';
import { ActualizarMiembro } from '../../application/use-cases/miembros/ActualizarMiembro.js';
import { QuitarMiembro } from '../../application/use-cases/miembros/QuitarMiembro.js';
import { TransferirTablero } from '../../application/use-cases/miembros/TransferirTablero.js';
import { CrearInvitacion } from '../../application/use-cases/invitaciones/CrearInvitacion.js';
import { ListarInvitaciones } from '../../application/use-cases/invitaciones/ListarInvitaciones.js';
import { CancelarInvitacion } from '../../application/use-cases/invitaciones/CancelarInvitacion.js';
import { VerInvitacion } from '../../application/use-cases/invitaciones/VerInvitacion.js';
import { AceptarInvitacion } from '../../application/use-cases/invitaciones/AceptarInvitacion.js';
import { RechazarInvitacion } from '../../application/use-cases/invitaciones/RechazarInvitacion.js';
import { ListarMisInvitaciones } from '../../application/use-cases/invitaciones/ListarMisInvitaciones.js';
import { ListarNotas } from '../../application/use-cases/notas/ListarNotas.js';
import { ObtenerNota } from '../../application/use-cases/notas/ObtenerNota.js';
import { CrearNota } from '../../application/use-cases/notas/CrearNota.js';
import { EditarNota } from '../../application/use-cases/notas/EditarNota.js';
import { MoverNota } from '../../application/use-cases/notas/MoverNota.js';
import { PagarNota } from '../../application/use-cases/notas/PagarNota.js';
import { AbonarNota } from '../../application/use-cases/notas/AbonarNota.js';
import { BorrarNota } from '../../application/use-cases/notas/BorrarNota.js';
import { ListarPagos } from '../../application/use-cases/pagos/ListarPagos.js';
import { RegistrarPago } from '../../application/use-cases/pagos/RegistrarPago.js';
import { DecidirPago } from '../../application/use-cases/pagos/DecidirPago.js';
import { AnularPago } from '../../application/use-cases/pagos/AnularPago.js';
import { ObtenerBalance } from '../../application/use-cases/balances/ObtenerBalance.js';
import { ListarActividad } from '../../application/use-cases/actividad/ListarActividad.js';
import { ListarCategorias } from '../../application/use-cases/categorias/ListarCategorias.js';
import { CrearCategoria } from '../../application/use-cases/categorias/CrearCategoria.js';
import { EditarCategoria } from '../../application/use-cases/categorias/EditarCategoria.js';
import { BorrarCategoria } from '../../application/use-cases/categorias/BorrarCategoria.js';
import { SolicitarRecuperacion } from '../../application/use-cases/auth/SolicitarRecuperacion.js';
import { RestablecerPassword } from '../../application/use-cases/auth/RestablecerPassword.js';
import { FirmarSubida } from '../../application/use-cases/archivos/FirmarSubida.js';
import { RegistrarAdjunto } from '../../application/use-cases/archivos/RegistrarAdjunto.js';
import { BorrarAdjunto } from '../../application/use-cases/archivos/BorrarAdjunto.js';
import { ListarPresupuestos } from '../../application/use-cases/presupuestos/ListarPresupuestos.js';
import { GuardarPresupuesto } from '../../application/use-cases/presupuestos/GuardarPresupuesto.js';
import { BorrarPresupuesto } from '../../application/use-cases/presupuestos/BorrarPresupuesto.js';
import { ListarComentarios } from '../../application/use-cases/comentarios/ListarComentarios.js';
import { CrearComentario } from '../../application/use-cases/comentarios/CrearComentario.js';
import { BorrarComentario } from '../../application/use-cases/comentarios/BorrarComentario.js';
import { ArchivarNota } from '../../application/use-cases/notas/ArchivarNota.js';
import { ArchivarSaldadas } from '../../application/use-cases/notas/ArchivarSaldadas.js';
import { ObtenerReporte } from '../../application/use-cases/reportes/ObtenerReporte.js';
import { RecordatoriosDelDia } from '../../application/use-cases/integraciones/RecordatoriosDelDia.js';
import { ConectarCobros } from '../../application/use-cases/cobros/ConectarCobros.js';
import { EstadoCobros } from '../../application/use-cases/cobros/EstadoCobros.js';
import { PagarConTarjeta } from '../../application/use-cases/cobros/PagarConTarjeta.js';
import { VerificarPagoConTarjeta } from '../../application/use-cases/cobros/VerificarPagoConTarjeta.js';
import { AvisoPasarela } from '../../application/use-cases/cobros/AvisoPasarela.js';
import { LiquidarMisDeudas } from '../../application/use-cases/pagos/LiquidarMisDeudas.js';
import { ImportarMovimientos } from '../../application/use-cases/notas/ImportarMovimientos.js';
import { ListarIngresos } from '../../application/use-cases/ingresos/ListarIngresos.js';
import { CrearIngreso } from '../../application/use-cases/ingresos/CrearIngreso.js';
import { BorrarIngreso } from '../../application/use-cases/ingresos/BorrarIngreso.js';
import { ListarMetas } from '../../application/use-cases/metas/ListarMetas.js';
import { CrearMeta } from '../../application/use-cases/metas/CrearMeta.js';
import { AportarMeta } from '../../application/use-cases/metas/AportarMeta.js';
import { BorrarMeta } from '../../application/use-cases/metas/BorrarMeta.js';

/** Nombre del caso de uso (como lo piden los controladores) → clase. */
const CASOS = {
  registrarUsuario: RegistrarUsuario,
  iniciarSesion: IniciarSesion,
  obtenerPerfil: ObtenerPerfil,
  actualizarPerfil: ActualizarPerfil,
  crearTablero: CrearTablero,
  listarMisTableros: ListarMisTableros,
  obtenerTablero: ObtenerTablero,
  actualizarTablero: ActualizarTablero,
  borrarTablero: BorrarTablero,
  cambiarTipoTablero: CambiarTipoTablero,
  verificarAccesoEnVivo: VerificarAccesoEnVivo,
  listarMiembros: ListarMiembros,
  actualizarMiembro: ActualizarMiembro,
  quitarMiembro: QuitarMiembro,
  transferirTablero: TransferirTablero,
  crearInvitacion: CrearInvitacion,
  listarInvitaciones: ListarInvitaciones,
  cancelarInvitacion: CancelarInvitacion,
  verInvitacion: VerInvitacion,
  aceptarInvitacion: AceptarInvitacion,
  rechazarInvitacion: RechazarInvitacion,
  listarMisInvitaciones: ListarMisInvitaciones,
  listarNotas: ListarNotas,
  obtenerNota: ObtenerNota,
  crearNota: CrearNota,
  editarNota: EditarNota,
  moverNota: MoverNota,
  pagarNota: PagarNota,
  abonarNota: AbonarNota,
  borrarNota: BorrarNota,
  listarPagos: ListarPagos,
  registrarPago: RegistrarPago,
  decidirPago: DecidirPago,
  anularPago: AnularPago,
  obtenerBalance: ObtenerBalance,
  listarActividad: ListarActividad,
  listarCategorias: ListarCategorias,
  crearCategoria: CrearCategoria,
  editarCategoria: EditarCategoria,
  borrarCategoria: BorrarCategoria,
  solicitarRecuperacion: SolicitarRecuperacion,
  restablecerPassword: RestablecerPassword,
  firmarSubida: FirmarSubida,
  registrarAdjunto: RegistrarAdjunto,
  borrarAdjunto: BorrarAdjunto,
  listarPresupuestos: ListarPresupuestos,
  guardarPresupuesto: GuardarPresupuesto,
  borrarPresupuesto: BorrarPresupuesto,
  listarComentarios: ListarComentarios,
  crearComentario: CrearComentario,
  borrarComentario: BorrarComentario,
  archivarNota: ArchivarNota,
  archivarSaldadas: ArchivarSaldadas,
  obtenerReporte: ObtenerReporte,
  recordatoriosDelDia: RecordatoriosDelDia,
  liquidarMisDeudas: LiquidarMisDeudas,
  conectarCobros: ConectarCobros,
  estadoCobros: EstadoCobros,
  pagarConTarjeta: PagarConTarjeta,
  verificarPagoConTarjeta: VerificarPagoConTarjeta,
  avisoPasarela: AvisoPasarela,
  importarMovimientos: ImportarMovimientos,
  listarIngresos: ListarIngresos,
  crearIngreso: CrearIngreso,
  borrarIngreso: BorrarIngreso,
  listarMetas: ListarMetas,
  crearMeta: CrearMeta,
  aportarMeta: AportarMeta,
  borrarMeta: BorrarMeta,
};

/**
 * Fábrica de casos de uso: cada uno toma de `deps` (repositorios, puertos y
 * servicios de aplicación) solo lo que declara en su constructor.
 */
export class UseCaseFactory {
  static crearTodos(deps) {
    return Object.fromEntries(Object.entries(CASOS).map(([nombre, Caso]) => [nombre, new Caso(deps)]));
  }
}
