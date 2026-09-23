import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { comisionTarjeta } from '../../src/domain/services/ComisionTarjeta.js';
import { Pago } from '../../src/domain/entities/Pago.js';
import { StripePasarela } from '../../src/infrastructure/payments/StripePasarela.js';

describe('Comisión de tarjeta', () => {
  test('quien cobra recibe exacto lo que le deben después de la tarifa de Stripe (3.6 % + $3 + IVA)', () => {
    for (const monto of [10, 99.99, 3400, 25000]) {
      const { comision, total } = comisionTarjeta(monto);
      // En centavos para no depender del redondeo de punto flotante
      const recibe = Math.round(total * 100) - Math.round((total * 0.036 + 3) * 1.16 * 100);
      assert.ok(recibe >= Math.round(monto * 100), `${monto}: solo recibe ${recibe / 100}`);
      assert.ok(recibe - Math.round(monto * 100) <= 2, `${monto}: sobra de más`);
      assert.equal(Math.round((monto + comision) * 100), Math.round(total * 100));
    }
    assert.deepEqual(comisionTarjeta(3400), { comision: 151.81, total: 3551.81 });
  });
});

describe('Pago con tarjeta', () => {
  test('nace confirmado, con método tarjeta y la sesión de Stripe', () => {
    const pago = Pago.conTarjeta({ deUsuarioId: 'ana', aUsuarioId: 'beto', monto: 3400 }, { tableroId: 't1', miembrosIds: ['ana', 'beto'], sesionId: 'cs_test_1' });
    assert.deepEqual([pago.estado, pago.metodo, pago.registradoPor, pago.stripeSesionId], ['confirmado', 'tarjeta', 'ana', 'cs_test_1']);
    assert.ok(pago.cuentaEnBalance());
    assert.throws(() => Pago.conTarjeta({ deUsuarioId: 'ana', aUsuarioId: 'intruso', monto: 5 }, { tableroId: 't1', miembrosIds: ['ana'], sesionId: 'x' }));
  });
});

describe('Avisos de Stripe (webhook)', () => {
  const secreto = 'whsec_prueba';
  const pasarela = new StripePasarela({ llaveSecreta: 'sk_test_x', secretoAvisos: secreto });
  const cuerpo = JSON.stringify({ type: 'checkout.session.completed', data: { object: { id: 'cs_test_1' } } });
  const firmar = (t, texto = cuerpo) => `t=${t},v1=${crypto.createHmac('sha256', secreto).update(`${t}.${texto}`).digest('hex')}`;
  const ahora = () => Math.floor(Date.now() / 1000);

  test('acepta la firma válida y rechaza la alterada, la vieja o la de otro cuerpo', () => {
    assert.deepEqual(pasarela.verificarAviso(cuerpo, firmar(ahora())), { tipo: 'checkout.session.completed', objeto: { id: 'cs_test_1' } });
    assert.throws(() => pasarela.verificarAviso(cuerpo, firmar(ahora()).replace(/.$/, '0')), /Firma inválida/);
    assert.throws(() => pasarela.verificarAviso(cuerpo, firmar(ahora() - 3600)), /vencida/);
    assert.throws(() => pasarela.verificarAviso(cuerpo.replace('cs_test_1', 'cs_test_2'), firmar(ahora())), /Firma inválida/);
  });
});
