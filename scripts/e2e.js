/**
 * Prueba de punta a punta contra el servidor corriendo (API=http://localhost:3200 por defecto).
 * Crea cuentas de prueba (e2e-*@prueba.local), tableros personal y compartido, notas, pagos
 * y revisa los eventos en vivo. Al final borra todo lo que creó.
 *
 *   npm run e2e
 */
import assert from 'node:assert/strict';
import { io } from 'socket.io-client';
import { pool } from '../src/infrastructure/database/pool.js';

const API = process.env.API ?? 'http://localhost:3200';
const marca = Date.now().toString(36);
let pasos = 0;
const paso = (t) => console.log(`✔ ${++pasos}. ${t}`);

async function pedir(metodo, ruta, { token, body, esperado = [200, 201, 204], headers = {} } = {}) {
  const r = await fetch(API + ruta, {
    method: metodo,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = r.status === 204 ? null : await r.json();
  if (![].concat(esperado).includes(r.status)) throw new Error(`${metodo} ${ruta} → ${r.status} ${JSON.stringify(json)}`);
  return json?.data ?? json;
}

const registrar = (nombre) =>
  pedir('POST', '/auth/registro', { body: { nombre, email: `e2e-${marca}-${nombre.toLowerCase()}@prueba.local`, password: 'secreta123' } });

function conectar(token) {
  return new Promise((ok, mal) => {
    const s = io(API, { auth: { token }, transports: ['websocket'] });
    s.eventos = [];
    s.onAny((ev, d) => s.eventos.push([ev, d]));
    s.on('connect', () => ok(s));
    s.on('connect_error', mal);
  });
}
const esperarEvento = (s, ev, ms = 4000) =>
  new Promise((ok, mal) => {
    const ya = s.eventos.find(([e]) => e === ev);
    if (ya) return ok(ya[1]);
    const t = setTimeout(() => mal(new Error(`No llegó ${ev}`)), ms);
    s.once(ev, (d) => (clearTimeout(t), ok(d)));
  });
const limpiar = (...ss) => ss.forEach((s) => (s.eventos.length = 0));

const sockets = [];
try {
  // ---------- cuentas ----------
  const ana = await registrar('Ana');
  const beto = await registrar('Beto');
  const caro = await registrar('Caro');
  const intruso = await registrar('Intruso');
  await pedir('POST', '/auth/login', { body: { email: beto.usuario.email, password: 'mala' }, esperado: 401 });
  const yo = await pedir('GET', '/auth/yo', { token: ana.token });
  assert.equal(yo.nombre, 'Ana');
  assert.equal(yo.passwordHash, undefined);
  paso('registro, login incorrecto (401) y /auth/yo sin passwordHash');

  // ---------- tablero personal ----------
  const [personal] = await pedir('GET', '/tableros', { token: ana.token });
  assert.equal(personal.tipo, 'personal');
  assert.equal(personal.nombre, 'Mis finanzas');
  const P = `/tableros/${personal.id}`;
  const catsPersonal = await pedir('GET', `${P}/categorias`, { token: ana.token });
  assert.equal(catsPersonal.length, 8);
  const catSuper = catsPersonal.find((c) => c.nombre === 'Súper');
  const mascotas = await pedir('POST', `${P}/categorias`, { token: ana.token, body: { nombre: 'Mascotas', icono: 'pets', color: '#8A4FD6' } });
  await pedir('POST', `${P}/categorias`, { token: ana.token, body: { nombre: 'mascotas' }, esperado: 409 });
  await pedir('POST', `${P}/notas`, { token: ana.token, body: { titulo: 'Súper', monto: 1200, categoriaId: catSuper.id, color: 'verde' } });
  await pedir('POST', `${P}/notas`, { token: ana.token, body: { titulo: 'Croquetas', monto: 450, categoriaId: mascotas.id } });
  await pedir('POST', `${P}/notas`, { token: ana.token, body: { tipo: 'servicio', titulo: 'Luz', monto: 450, venceEn: '2020-01-10' } });
  const juan = await pedir('POST', `${P}/notas`, {
    token: ana.token, body: { tipo: 'prestamo', titulo: 'Préstamo de Juan', monto: 500, contraparte: 'Juan', direccion: 'debo', color: 'rosa' },
  });
  const abonada = await pedir('POST', `${P}/notas/${juan.id}/abonos`, { token: ana.token, body: { monto: 200 } });
  assert.equal(abonada.abonado, 200);
  await pedir('POST', `${P}/notas/${juan.id}/abonos`, { token: ana.token, body: { monto: 400 }, esperado: 422 });
  await pedir('POST', `${P}/notas`, { token: ana.token, body: { titulo: 'x', monto: 5, participantes: [{ usuarioId: beto.usuario.id }] }, esperado: 422 });
  await pedir('POST', `${P}/invitaciones`, { token: ana.token, body: {}, esperado: 422 });
  const resumen = await pedir('GET', `${P}/balance`, { token: ana.token });
  assert.equal(resumen.tipo, 'personal');
  assert.equal(resumen.gastadoMes, 1650);
  assert.deepEqual(resumen.porCategoria.map((c) => [c.nombre, c.icono, c.total]), [['Súper', 'shopping_cart', 1200], ['Mascotas', 'pets', 450]]);
  assert.deepEqual(resumen.vencidas, { total: 450, cantidad: 1 });
  assert.equal(resumen.debo, 300);
  await pedir('GET', P, { token: beto.token, esperado: 404 });
  paso('tablero personal automático con 8 categorías + una propia (Mascotas); gasto, recibo vencido, deuda con Juan + abono; no admite invitados ni repartos');

  // ---------- tablero compartido e invitaciones ----------
  const tablero = await pedir('POST', '/tableros', { token: ana.token, body: { nombre: 'Casa', descripcion: 'Gastos del depa', tipo: 'compartido' } });
  assert.equal(tablero.miRol, 'propietario');
  const T = `/tableros/${tablero.id}`;
  const enlace = await pedir('POST', `${T}/invitaciones`, { token: ana.token, body: { usosMax: 5 } });
  const personalCaro = await pedir('POST', `${T}/invitaciones`, { token: ana.token, body: { email: caro.usuario.email } });
  const previa = await pedir('GET', `/invitaciones/${enlace.codigo}`, { token: beto.token });
  assert.equal(previa.tablero, 'Casa');
  assert.equal(previa.vigente, true);
  await pedir('POST', `/invitaciones/${enlace.codigo}/aceptar`, { token: beto.token });
  assert.equal((await pedir('GET', '/invitaciones/pendientes', { token: caro.token })).length, 1);
  await pedir('POST', `/invitaciones/${personalCaro.codigo}/aceptar`, { token: intruso.token, esperado: 403 });
  await pedir('POST', `/invitaciones/${personalCaro.codigo}/aceptar`, { token: caro.token });
  await pedir('POST', `${T}/invitaciones`, { token: beto.token, body: {}, esperado: 403 });
  await pedir('GET', T, { token: intruso.token, esperado: 404 });
  await pedir('GET', '/tableros/no-es-uuid', { token: ana.token, esperado: 404 });
  assert.equal((await pedir('GET', T, { token: ana.token })).miembros.length, 3);
  paso('compartido: enlace abierto + invitación personal; intruso 404; solo admins invitan');

  // ---------- tiempo real ----------
  const [sAna, sBeto, sCaro, sIntruso] = await Promise.all([ana, beto, caro, intruso].map((u) => conectar(u.token)));
  sockets.push(sAna, sBeto, sCaro, sIntruso);
  for (const s of [sAna, sBeto, sCaro]) assert.equal((await s.emitWithAck('tablero:unirse', tablero.id)).ok, true);
  assert.equal((await sIntruso.emitWithAck('tablero:unirse', tablero.id)).ok, false);
  paso('los 3 entran al tablero por socket; el intruso no');

  // ---------- notas ----------
  limpiar(sAna, sBeto, sCaro);
  const súper = await pedir('POST', `${T}/notas`, { token: ana.token, body: { titulo: 'Súper del sábado', monto: 300, posX: 100, posY: 80 } });
  assert.equal(súper.pagadoPor, ana.usuario.id);
  assert.deepEqual(súper.partes.map((p) => p.monto), [100, 100, 100]);
  assert.equal((await esperarEvento(sCaro, 'nota:creada')).id, súper.id);
  await esperarEvento(sCaro, 'balance:cambio');
  paso('nota "Súper" 300 en partes iguales; a Caro le llegan nota:creada y balance:cambio en vivo');

  const luz = await pedir('POST', `${T}/notas`, {
    token: ana.token,
    body: {
      tipo: 'servicio', titulo: 'Luz', monto: 900, recurrencia: 'mensual', fecha: '2026-09-01', venceEn: '2026-09-30', modoReparto: 'proporcion',
      participantes: [{ usuarioId: ana.usuario.id, proporcion: 1 }, { usuarioId: beto.usuario.id, proporcion: 1 }, { usuarioId: caro.usuario.id, proporcion: 2 }],
    },
  });
  assert.equal(luz.estado, 'por_pagar');
  assert.deepEqual(luz.partes.map((p) => p.monto), [225, 225, 450]);
  assert.equal((await pedir('GET', `${T}/balance`, { token: ana.token })).mio.neto, 200);
  const pagoLuz = await pedir('POST', `${T}/notas/${luz.id}/pagar`, { token: beto.token, body: {} });
  assert.equal(pagoLuz.nota.pagadoPor, beto.usuario.id);
  assert.equal(pagoLuz.siguiente.estado, 'por_pagar');
  assert.equal(pagoLuz.siguiente.fecha, '2026-10-01');
  assert.equal(pagoLuz.siguiente.venceEn, '2026-10-30');
  paso('"Luz" por pagar (1:1:2) no mueve el balance; Beto la paga y se clava la de octubre');

  let bal = await pedir('GET', `${T}/balance`, { token: ana.token });
  const neto = Object.fromEntries(bal.netos.map((n) => [n.nombre, n.neto]));
  assert.deepEqual(neto, { Ana: -25, Beto: 575, Caro: -550 });
  assert.equal(bal.sugerencias.length, 2);
  paso(`balance ${JSON.stringify(neto)} con ${bal.sugerencias.length} pagos sugeridos`);

  await pedir('PATCH', `${T}/notas/${súper.id}`, { token: beto.token, body: { titulo: 'hack' }, esperado: 403 });
  await pedir('PATCH', `${T}/notas/${súper.id}`, {
    token: ana.token,
    body: { monto: 330, modoReparto: 'montos', participantes: [{ usuarioId: beto.usuario.id, monto: 200 }, { usuarioId: caro.usuario.id, monto: 100 }] },
    esperado: 422,
  });
  await pedir('POST', `${T}/notas`, { token: ana.token, body: { tipo: 'prestamo', titulo: 'x', monto: 5, contraparte: 'Juan', direccion: 'debo' }, esperado: 422 });
  const editada = await pedir('PATCH', `${T}/notas/${súper.id}`, { token: ana.token, body: { monto: 330 } });
  assert.deepEqual(editada.partes.map((p) => p.monto), [110, 110, 110]);
  paso('permisos (403), montos que no cuadran (422), deuda externa en compartido (422); cambiar monto re-reparte');

  // ---------- mover en el corcho ----------
  limpiar(sAna, sBeto);
  sAna.emit('nota:arrastrando', { tableroId: tablero.id, notaId: súper.id, posX: 150, posY: 90 });
  await esperarEvento(sBeto, 'nota:arrastrando');
  const movida = await pedir('PATCH', `${T}/notas/${súper.id}/posicion`, {
    token: beto.token, body: { posX: 200, posY: 120, alFrente: true }, headers: { 'x-socket-id': sBeto.id },
  });
  assert.equal((await esperarEvento(sAna, 'nota:movida')).posX, 200);
  assert.ok(movida.z > súper.z);
  await new Promise((r) => setTimeout(r, 300));
  assert.ok(!sBeto.eventos.some(([e]) => e === 'nota:movida'), 'Beto no debe recibir su propio eco');
  paso('arrastre en vivo + posición guardada al soltar, sin eco a quien movió');

  // ---------- pagos ----------
  limpiar(sAna);
  const p1 = await pedir('POST', `${T}/pagos`, { token: caro.token, body: { aUsuarioId: ana.usuario.id, monto: 110, notaId: súper.id, metodo: 'transferencia' } });
  assert.equal(p1.estado, 'pendiente');
  await esperarEvento(sAna, 'pago:por_confirmar');
  await pedir('POST', `${T}/pagos/${p1.id}/confirmar`, { token: caro.token, esperado: 403 });
  await pedir('POST', `${T}/pagos/${p1.id}/confirmar`, { token: ana.token });
  const trasPago = await pedir('GET', `${T}/notas/${súper.id}`, { token: ana.token });
  assert.equal(trasPago.partes.find((p) => p.usuarioId === caro.usuario.id).liquidada, true);
  assert.equal(trasPago.estado, 'pagada');
  paso('Caro registra pago (pendiente + aviso personal a Ana); solo Ana confirma; la parte de Caro queda liquidada');

  const p2 = await pedir('POST', `${T}/pagos`, { token: ana.token, body: { deUsuarioId: beto.usuario.id, aUsuarioId: ana.usuario.id, monto: 110, notaId: súper.id } });
  assert.equal(p2.estado, 'confirmado');
  assert.equal((await pedir('GET', `${T}/notas/${súper.id}`, { token: ana.token })).estado, 'liquidada');
  await pedir('DELETE', `${T}/notas/${súper.id}`, { token: ana.token, esperado: 409 });
  await pedir('POST', `${T}/miembros/salir`, { token: caro.token, esperado: 409 });
  await pedir('DELETE', `${T}/pagos/${p2.id}`, { token: beto.token, esperado: 403 });
  await pedir('DELETE', `${T}/pagos/${p2.id}`, { token: ana.token });
  assert.equal((await pedir('GET', `${T}/notas/${súper.id}`, { token: ana.token })).estado, 'pagada');
  paso('pago confirmado liquida el súper; anularlo lo reabre; no se borra nota con pagos ni sale quien debe (409)');

  // ---------- recordatorio, actividad, inicio ----------
  const rec = await pedir('POST', `${T}/notas`, { token: caro.token, body: { tipo: 'recordatorio', titulo: 'Comprar garrafón', color: 'rosa' } });
  assert.equal(rec.monto, null);
  assert.equal((await pedir('POST', `${T}/notas/${rec.id}/pagar`, { token: beto.token, body: {} })).nota.estado, 'liquidada');
  assert.equal((await pedir('GET', `${T}/actividad?porPagina=5`, { token: beto.token })).length, 5);
  const mios = await pedir('GET', '/tableros', { token: caro.token });
  assert.deepEqual(mios.map((t) => t.tipo), ['personal', 'compartido']);
  bal = await pedir('GET', `${T}/balance`, { token: caro.token });
  assert.equal(mios[1].miNeto, bal.mio.neto);
  assert.equal(mios[1].integrantes.length, 3);
  paso(`recordatorio hecho; bitácora; inicio con personal + compartido y mi saldo (Caro: ${mios[1].miNeto})`);

  // ---------- roles y tipo ----------
  await pedir('PATCH', `${T}/miembros/${beto.usuario.id}`, { token: caro.token, body: { rol: 'admin' }, esperado: 403 });
  await pedir('PATCH', `${T}/miembros/${beto.usuario.id}`, { token: ana.token, body: { rol: 'admin' } });
  await pedir('PATCH', `${T}/miembros/${caro.usuario.id}`, { token: caro.token, body: { apodo: 'Caro 🌸' } });
  await pedir('DELETE', T, { token: beto.token, esperado: 403 });
  await pedir('PATCH', `${T}/tipo`, { token: ana.token, body: { tipo: 'personal' }, esperado: 422 });
  const compartido = await pedir('PATCH', `${P}/tipo`, { token: ana.token, body: { tipo: 'compartido' } });
  assert.equal(compartido.tipo, 'compartido');
  paso('roles; solo el propietario borra; un compartido con gente no vuelve a personal; un personal sí se comparte');

  assert.ok((await pedir('GET', `${T}/notas?estado=por_pagar`, { token: ana.token })).every((n) => n.estado === 'por_pagar'));
  await pedir('GET', `${T}/notas?estado=inventado`, { token: ana.token, esperado: 400 });
  paso('filtros válidos funcionan; valores no permitidos → 400');

  // ---------- a meses ----------
  const catCasa = (await pedir('GET', `${T}/categorias`, { token: ana.token }))[0];
  await pedir('POST', `${T}/notas`, { token: ana.token, body: { titulo: 'x', monto: 10, categoriaId: mascotas.id }, esperado: 422 });
  const tele = await pedir('POST', `${T}/notas`, {
    token: ana.token, body: { titulo: 'Tele', monto: 3000, plazoMeses: 3, venceEn: '2026-10-05', categoriaId: catCasa.id },
  });
  assert.equal(tele.monto, 1000);
  assert.equal(tele.numeroCuota, 1);
  assert.equal(tele.estado, 'por_pagar');
  const cuota1 = await pedir('POST', `${T}/notas/${tele.id}/pagar`, { token: ana.token, body: {} });
  assert.equal(cuota1.siguiente.numeroCuota, 2);
  assert.equal(cuota1.siguiente.venceEn, '2026-11-05');
  await pedir('PATCH', `${T}/notas/${cuota1.siguiente.id}`, { token: ana.token, body: { monto: 5 }, esperado: 422 });

  const prestamo = await pedir('POST', `${T}/notas`, {
    token: ana.token,
    body: { tipo: 'prestamo', titulo: 'Préstamo a Beto', monto: 600, plazoMeses: 6, participantes: [{ usuarioId: beto.usuario.id }] },
  });
  await pedir('POST', `${T}/pagos`, { token: ana.token, body: { deUsuarioId: beto.usuario.id, aUsuarioId: ana.usuario.id, monto: 200, notaId: prestamo.id } });
  const { planes } = await pedir('GET', `${T}/balance`, { token: beto.token });
  const planTele = planes.find((p) => p.tipo === 'compra');
  const planPrestamo = planes.find((p) => p.tipo === 'deuda');
  assert.deepEqual([planTele.pagadas, planTele.meses, planTele.restante], [1, 3, 2000]);
  assert.deepEqual([planPrestamo.pagadas, planPrestamo.mensualidad, planPrestamo.restante], [2, 100, 400]);
  paso('a meses: tele de 3 mil en 3 mensualidades (pagar clava la siguiente) y préstamo a Beto en 6 meses (2 de 6 pagadas)');

  // ---------- perfil: celular, avisos y datos para pagar ----------
  const clabeAna = '072180001234567897';
  await pedir('PATCH', '/auth/yo', { token: ana.token, body: { clabe: '072180001234567890' }, esperado: 422 });
  const perfil = await pedir('PATCH', '/auth/yo', { token: ana.token, body: { telefono: '55 1234 5678', avisosWhatsapp: true, clabe: clabeAna } });
  assert.equal(perfil.telefono, '525512345678');
  assert.equal(perfil.banco, 'Banorte');
  const anaVistaPorBeto = (await pedir('GET', `${T}/miembros`, { token: beto.token })).find((m) => m.usuarioId === ana.usuario.id);
  assert.equal(anaVistaPorBeto.clabe, clabeAna);
  assert.equal(anaVistaPorBeto.telefono, undefined);
  paso('perfil: celular con lada, CLABE validada (banco deducido); los miembros ven la CLABE pero no el celular');

  // ---------- presupuestos ----------
  await pedir('PUT', `${P}/presupuestos`, { token: ana.token, body: { categoriaId: mascotas.id, montoMensual: 400 } });
  await pedir('PUT', `${P}/presupuestos`, { token: ana.token, body: { categoriaId: catSuper.id, montoMensual: 5000 } });
  const conPresupuestos = await pedir('GET', `${P}/balance`, { token: ana.token });
  const avance = Object.fromEntries(conPresupuestos.presupuestos.map((p) => [p.categoriaId, p.estado]));
  assert.equal(avance[mascotas.id], 'excedido');
  assert.equal(avance[catSuper.id], 'ok');
  await pedir('PUT', `${T}/presupuestos`, { token: caro.token, body: { categoriaId: catCasa.id, montoMensual: 100 }, esperado: 403 });
  paso('presupuestos: Mascotas $400 (gastado 450 → excedido), Súper $5,000 ok; en compartido solo admins');

  // ---------- fotos de tickets (Cloudinary de verdad) ----------
  const firma = await pedir('POST', `${T}/notas/fotos/firma`, { token: beto.token });
  assert.equal(firma.campos.folder, `corcho/tableros/${tablero.id}`);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64');
  const formulario = new FormData();
  for (const [k, v] of Object.entries(firma.campos)) formulario.append(k, String(v));
  formulario.append('file', new Blob([png], { type: 'image/png' }), 'ticket.png');
  const subida = await (await fetch(firma.url, { method: 'POST', body: formulario })).json();
  assert.ok(subida.public_id, JSON.stringify(subida));
  const foto = await pedir('POST', `${T}/notas/${tele.id}/adjuntos`, {
    token: beto.token, body: { publicId: subida.public_id, url: subida.secure_url, ancho: subida.width, alto: subida.height, formato: subida.format, bytes: subida.bytes },
  });
  await pedir('POST', `${T}/notas/${tele.id}/adjuntos`, { token: beto.token, body: { publicId: 'otra/cosa', url: subida.secure_url }, esperado: 422 });
  assert.equal((await pedir('GET', `${T}/notas/${tele.id}`, { token: ana.token })).adjuntos.length, 1);
  await pedir('DELETE', `${T}/notas/${tele.id}/adjuntos/${foto.id}`, { token: caro.token, esperado: 403 });
  await pedir('DELETE', `${T}/notas/${tele.id}/adjuntos/${foto.id}`, { token: beto.token });
  const yaNoEsta = await fetch(subida.secure_url, { method: 'HEAD' });
  paso(`fotos: firma del servidor → subida directa a Cloudinary → pegada a la nota → borrada (Cloudinary ya responde ${yaNoEsta.status})`);

  // ---------- comentarios con mención ----------
  limpiar(sBeto);
  const comentario = await pedir('POST', `${T}/notas/${tele.id}/comentarios`, { token: ana.token, body: { texto: '@Beto ¿ya pagaste la tele?', menciones: [beto.usuario.id] } });
  assert.equal(comentario.autor, 'Ana');
  const mencion = await esperarEvento(sBeto, 'mencion');
  assert.equal(mencion.nota, 'Tele');
  assert.equal((await pedir('GET', `${T}/notas/${tele.id}`, { token: ana.token })).comentarios, 1);
  await pedir('DELETE', `${T}/notas/${tele.id}/comentarios/${comentario.id}`, { token: caro.token, esperado: 403 });
  assert.equal((await pedir('GET', `${T}/notas/${tele.id}/comentarios`, { token: caro.token })).length, 1);
  paso('comentarios: a Beto le llega su @mención en vivo; solo el autor o un admin borra');

  // ---------- búsqueda y archivo ----------
  assert.ok((await pedir('GET', `${T}/notas?q=tele`, { token: ana.token })).every((n) => n.titulo.toLowerCase().includes('tele')));
  await pedir('PATCH', `${T}/notas/${rec.id}/archivo`, { token: ana.token, body: { archivada: true } });
  const { archivadas } = await pedir('POST', `${T}/notas/archivar-saldadas`, { token: ana.token });
  const archivo = await pedir('GET', `${T}/notas?archivadas=true`, { token: ana.token });
  assert.ok(archivo.some((n) => n.id === rec.id));
  assert.ok(!(await pedir('GET', `${T}/notas`, { token: ana.token })).some((n) => n.id === rec.id));
  const porPagarNoSeArchiva = (await pedir('GET', `${T}/notas?estado=por_pagar`, { token: ana.token }))[0];
  await pedir('PATCH', `${T}/notas/${porPagarNoSeArchiva.id}/archivo`, { token: ana.token, body: { archivada: true }, esperado: 422 });
  paso(`búsqueda por texto; archivo (recordatorio hecho + ${archivadas} saldadas más); lo pendiente no se archiva`);

  // ---------- reportes ----------
  const reporte = await pedir('GET', `${T}/reportes?meses=3`, { token: caro.token });
  assert.equal(reporte.porMes.length, 3);
  assert.ok(reporte.total > 0 && reporte.porPersona.length === 3 && reporte.detalle.length > 0);
  paso(`reportes: 3 meses, total ${reporte.total}, por persona y detalle para exportar`);

  // ---------- recordatorios para n8n ----------
  const manana = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  await pedir('POST', `${T}/notas`, { token: ana.token, body: { tipo: 'servicio', titulo: 'Internet', monto: 600, venceEn: manana } });
  await pedir('GET', '/integraciones/recordatorios', { esperado: 401 });
  const { avisos } = await pedir('GET', '/integraciones/recordatorios?diasAntes=1', { headers: { 'x-integracion-token': process.env.INTEGRACION_TOKEN } });
  const avisoAna = avisos.find((a) => a.usuarioId === ana.usuario.id && a.tableroId === tablero.id);
  assert.ok(avisoAna, JSON.stringify(avisos));
  assert.equal(avisoAna.telefono, '525512345678');
  assert.ok(!avisos.some((a) => a.usuarioId === beto.usuario.id), 'Beto no activó avisos');
  paso(`recordatorios (n8n): "${avisoAna.mensaje}"`);

  // ---------- recuperar contraseña ----------
  await pedir('POST', '/auth/recuperar', { body: { email: 'nadie@prueba.local' }, esperado: 204 });
  await pedir('POST', '/auth/recuperar', { body: { email: caro.usuario.email }, esperado: 204 });
  const tokenPrueba = 'token-de-prueba-e2e-suficientemente-largo';
  const { createHash } = await import('node:crypto');
  await pool.query(`INSERT INTO recuperaciones (usuario_id, token_hash, expira_en) VALUES ($1, $2, now() + interval '1 hour')`, [
    caro.usuario.id,
    createHash('sha256').update(tokenPrueba).digest('hex'),
  ]);
  const nueva = await pedir('POST', '/auth/restablecer', { body: { token: tokenPrueba, password: 'nueva-secreta-123' } });
  assert.ok(nueva.token);
  await pedir('POST', '/auth/restablecer', { body: { token: tokenPrueba, password: 'otra-secreta-123' }, esperado: 410 });
  await pedir('POST', '/auth/login', { body: { email: caro.usuario.email, password: 'nueva-secreta-123' } });
  paso('recuperar contraseña: misma respuesta exista o no el correo; el enlace es de un solo uso');
} finally {
  for (const s of sockets) s.close();
  await pool.query(
    `DELETE FROM tableros WHERE propietario_id IN (SELECT id FROM usuarios WHERE email LIKE $1)`,
    [`e2e-${marca}-%@prueba.local`],
  );
  await pool.query(`DELETE FROM usuarios WHERE email LIKE $1`, [`e2e-${marca}-%@prueba.local`]);
  await pool.end();
}
console.log(`\nE2E OK (${pasos} pasos)`);
process.exit(0);
