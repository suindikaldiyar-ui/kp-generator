// lib/telegram.js
// Отправка уведомления в Telegram через api.telegram.org.
// Если токен или chat_id не заданы — просто ничего не делаем (без ошибок).

const axios = require('axios');
const config = require('./config');

async function sendMessage(text) {
  if (!config.telegramBotToken || !config.telegramChatId) {
    // Telegram не настроен — тихо пропускаем.
    return { ok: false, skipped: true };
  }

  const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
  try {
    const res = await axios.post(url, {
      chat_id: config.telegramChatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }, { timeout: 5000 });
    return { ok: true, data: res.data };
  } catch (e) {
    // Не валим запрос клиента из-за Telegram — логируем и идём дальше.
    console.error('Ошибка отправки в Telegram:', e.response?.data || e.message);
    return { ok: false, error: e.message };
  }
}

module.exports = { sendMessage };
