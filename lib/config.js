// lib/config.js
// Читает настройки из .env и отдаёт их остальному коду в удобном виде.
// Здесь же лежат значения по умолчанию (никаких реальных секретов!).

require('dotenv').config();

function bool(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).trim().toLowerCase() === 'true';
}

function num(value, fallback) {
  const n = parseFloat(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const config = {
  // Секрет для подписи ссылок. Если не задан — используем небезопасный дефолт
  // (этого достаточно, чтобы код не падал локально, но в проде задай свой!).
  secretKey: process.env.SECRET_KEY || 'INSECURE_DEFAULT_CHANGE_ME',
  secretIsDefault: !process.env.SECRET_KEY,

  // Telegram
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',

  // Пароль на форму (пусто = без пароля)
  adminPassword: process.env.ADMIN_PASSWORD || '',

  // Компания
  companyName: process.env.COMPANY_NAME || 'Моя компания',
  companyLogoText: process.env.COMPANY_LOGO_TEXT || 'МК',

  // Валюта
  rateKztPerRub: num(process.env.EXCHANGE_RATE_KZT_PER_RUB, 5.5),
  useLiveRate: bool(process.env.USE_LIVE_RATE, false),
  showRub: bool(process.env.SHOW_RUB, true),
};

module.exports = config;
