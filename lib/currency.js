// lib/currency.js
// Пересчёт тенге (₸) в рубли (₽).
//
// По умолчанию используется фиксированный курс из .env (EXCHANGE_RATE_KZT_PER_RUB).
// Если USE_LIVE_RATE=true — пробуем взять курс рубля с Нацбанка РК.
// При любой ошибке тихо откатываемся на фиксированный курс.

const axios = require('axios');
const config = require('./config');

// Простой кэш, чтобы не дёргать Нацбанк на каждый запрос.
let cache = { rate: null, at: 0 };
const CACHE_MS = 60 * 60 * 1000; // 1 час

// Достаём из XML Нацбанка курс RUB (сколько тенге за 1 рубль).
async function fetchLiveRate() {
  const url = 'https://nationalbank.kz/rss/get_rates.cfm?fdate=' + todayDDMMYYYY();
  const res = await axios.get(url, { timeout: 4000 });
  const xml = String(res.data);

  // Ищем блок <item> ... <title>RUB</title> ... <description>X.XX</description>
  const items = xml.split('<item>');
  for (const item of items) {
    const titleMatch = item.match(/<title>\s*([A-Z]{3})\s*<\/title>/);
    const descMatch = item.match(/<description>\s*([\d.,]+)\s*<\/description>/);
    if (titleMatch && titleMatch[1] === 'RUB' && descMatch) {
      const rate = parseFloat(descMatch[1].replace(',', '.'));
      if (Number.isFinite(rate) && rate > 0) return rate;
    }
  }
  throw new Error('Курс RUB не найден в ответе Нацбанка');
}

function todayDDMMYYYY() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

// Возвращает актуальный курс (тенге за 1 рубль).
async function getRate() {
  if (!config.useLiveRate) return config.rateKztPerRub;

  // Свежий кэш?
  if (cache.rate && Date.now() - cache.at < CACHE_MS) return cache.rate;

  try {
    const live = await fetchLiveRate();
    cache = { rate: live, at: Date.now() };
    return live;
  } catch (e) {
    // Тихий откат на фиксированный курс
    return config.rateKztPerRub;
  }
}

// Перевод суммы из тенге в рубли при данном курсе.
function kztToRub(amountKzt, rate) {
  if (!rate || rate <= 0) return 0;
  return amountKzt / rate;
}

module.exports = { getRate, kztToRub };
