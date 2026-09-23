/**
 * CLABE interbancaria (18 dígitos): 3 de banco, 3 de plaza, 11 de cuenta y 1 verificador.
 * El verificador se calcula con pesos 3,7,1 sobre los primeros 17 dígitos.
 */
const PESOS = [3, 7, 1];

/** Bancos más comunes por su código (los 3 primeros dígitos). */
const BANCOS = {
  '002': 'Banamex',
  '012': 'BBVA',
  '014': 'Santander',
  '021': 'HSBC',
  '030': 'BanBajío',
  '036': 'Inbursa',
  '044': 'Scotiabank',
  '058': 'Banregio',
  '072': 'Banorte',
  '127': 'Banco Azteca',
  '137': 'BanCoppel',
  '646': 'STP',
  '638': 'Nu México',
  '722': 'Mercado Pago',
  '728': 'Spin by OXXO',
};

export function digitoVerificador(primeros17) {
  const suma = [...primeros17].reduce((total, d, i) => total + ((Number(d) * PESOS[i % 3]) % 10), 0);
  return (10 - (suma % 10)) % 10;
}

export function esClabeValida(clabe) {
  const limpia = String(clabe ?? '').replace(/\s/g, '');
  return /^[0-9]{18}$/.test(limpia) && digitoVerificador(limpia.slice(0, 17)) === Number(limpia[17]);
}

export function bancoDeClabe(clabe) {
  return BANCOS[String(clabe).slice(0, 3)] ?? null;
}
