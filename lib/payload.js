// lib/payload.js
// Превращает данные КП в подписанный токен для ссылки и обратно.
//
// Идея: токен = base64url(JSON данных) + "." + подпись(HMAC-SHA256).
// Подпись считается секретным ключом. Если клиент изменит данные в ссылке,
// подпись перестанет совпадать — и decode() выбросит ошибку. Так цены защищены.

const crypto = require('crypto');
const config = require('./config');

// --- base64url (безопасно для URL, без +, /, =) ---
function base64urlEncode(buf) {
  return buf.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

// --- подпись данных секретным ключом ---
function sign(dataString) {
  return base64urlEncode(
    crypto.createHmac('sha256', config.secretKey).update(dataString).digest()
  );
}

// Данные КП -> токен (строка для ссылки ?d=...)
function encode(data) {
  const json = JSON.stringify(data);
  const body = base64urlEncode(Buffer.from(json, 'utf8'));
  const signature = sign(body);
  return body + '.' + signature;
}

// Токен -> данные КП (или ошибка, если подпись/формат неверны)
function decode(token) {
  if (typeof token !== 'string' || !token.includes('.')) {
    throw new Error('Неверный формат ссылки');
  }
  const [body, signature] = token.split('.');
  const expected = sign(body);

  // Сравнение подписей в постоянное время (защита от подбора)
  const a = Buffer.from(signature || '');
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error('Подпись ссылки недействительна (данные были изменены)');
  }

  const json = base64urlDecode(body).toString('utf8');
  return JSON.parse(json);
}

module.exports = { encode, decode };
