// api/index.js
// Главное Express-приложение. Связывает все модули вместе.
//
// Локально:  node api/index.js  → слушает порт 3000.
// На Vercel: файл экспортирует app (module.exports), порт не слушается.

const express = require('express');
const config = require('../lib/config');
const payload = require('../lib/payload');
const currency = require('../lib/currency');
const telegram = require('../lib/telegram');
const template = require('../lib/template');
const adminPage = require('../lib/adminPage');

const app = express();
app.use(express.json({ limit: '256kb' }));

// Время по Алматы (UTC+5) в читаемом виде.
function almatyTime(date = new Date()) {
  return date.toLocaleString('ru-RU', {
    timeZone: 'Asia/Almaty',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Генерация номера КП: КП-ГГММДД-XXXX
function makeKpNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `КП-${ymd}-${rnd}`;
}

// ---------- GET / : форма создания КП (мой интерфейс) ----------
app.get('/', (req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(adminPage.render({
    needPassword: !!config.adminPassword,
    showRubDefault: config.showRub,
    defaultValidDays: 14,
    companyName: config.companyName,
  }));
});

// ---------- POST /api/create : подписать данные, вернуть ссылку ----------
app.post('/api/create', (req, res) => {
  try {
    const b = req.body || {};

    // Необязательный пароль на форму
    if (config.adminPassword && b.adminPassword !== config.adminPassword) {
      return res.status(401).json({ ok: false, error: 'Қате құпиясөз (неверный пароль)' });
    }

    const clientName = String(b.clientName || '').trim();
    const company = String(b.company || '').trim();
    const showRub = !!b.showRub;
    const validDays = Math.min(Math.max(parseInt(b.validDays, 10) || 14, 1), 365);

    if (!clientName) return res.status(400).json({ ok: false, error: 'Клиенттің аты қажет' });

    // Стоимость работ (главная сумма)
    const workKzt = Math.max(0, Math.round(Number(b.workCost) || 0));
    if (workKzt <= 0) return res.status(400).json({ ok: false, error: 'Жұмыс құны қажет' });

    // Дополнительные расходы: название + цена + период
    const expenses = Array.isArray(b.expenses) ? b.expenses
      .map(e => ({
        n: String(e.name || '').trim(),
        p: Math.max(0, Math.round(Number(e.price) || 0)),
        pd: String(e.period || '').trim(),
      }))
      .filter(e => e.n && e.p > 0) : [];

    const now = Date.now();
    const data = {
      n: makeKpNumber(),
      c: clientName,
      co: company,
      w: workKzt,     // стоимость работ
      e: expenses,    // доп. расходы
      sr: showRub,
      ca: now,
      ex: now + validDays * 24 * 60 * 60 * 1000,
    };

    const token = payload.encode(data);
    res.json({ ok: true, link: '/kp?d=' + encodeURIComponent(token) });
  } catch (e) {
    console.error('create error:', e);
    res.status(500).json({ ok: false, error: 'Серверде қате' });
  }
});

// ---------- GET /kp?d=... : страница КП для клиента ----------
app.get('/kp', async (req, res) => {
  try {
    const token = req.query.d;
    const data = payload.decode(token); // бросит ошибку, если подпись неверна

    // Стоимость работ + доп. расходы
    const workKzt = data.w || 0;
    const expenses = (data.e || []).map(e => ({ name: e.n, period: e.pd, priceKzt: e.p, priceRub: 0 }));
    const totalKzt = workKzt + expenses.reduce((sum, e) => sum + e.priceKzt, 0);

    // Пересчёт в рубли (только если включено)
    let workRub = 0, totalRub = 0;
    if (data.sr && config.showRub) {
      const rate = await currency.getRate();
      workRub = currency.kztToRub(workKzt, rate);
      expenses.forEach(e => { e.priceRub = currency.kztToRub(e.priceKzt, rate); });
      totalRub = currency.kztToRub(totalKzt, rate);
    }

    const kp = {
      token,
      kpNumber: data.n,
      companyName: config.companyName,
      companyLogoText: config.companyLogoText,
      clientName: data.c,
      company: data.co,
      workKzt,
      workRub,
      expenses,
      totalKzt,
      totalRub,
      showRub: data.sr && config.showRub,
      createdAt: data.ca,
      expiresAt: data.ex,
      expired: Date.now() > data.ex,
    };

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(template.render(kp));
  } catch (e) {
    res.status(400).set('Content-Type', 'text/html; charset=utf-8').send(
      `<div style="font-family:sans-serif;max-width:480px;margin:80px auto;text-align:center;color:#b42318">
        <h2>Ссылка недействительна</h2>
        <p>${template.esc(e.message)}</p>
        <p style="color:#888;font-size:14px">Возможно, ссылка повреждена или данные были изменены.</p>
      </div>`
    );
  }
});

// ---------- POST /api/accept : клиент принял → уведомление в Telegram ----------
app.post('/api/accept', async (req, res) => {
  try {
    const { token, name } = req.body || {};
    const signerName = String(name || '').trim();
    if (!signerName) return res.status(400).json({ ok: false, error: 'Имя обязательно' });

    const data = payload.decode(token); // проверка подписи

    if (Date.now() > data.ex) {
      return res.status(400).json({ ok: false, error: 'Срок действия предложения истёк' });
    }

    // Принятие зафиксировано. Уведомление в Telegram НЕ критично:
    // любые его ошибки (включая timeout) только логируем — клиент всегда
    // получает {ok:true}, чтобы страница показала «Условия приняты».
    try {
      const totalKzt = (data.w || 0) + (data.e || []).reduce((sum, e) => sum + e.p, 0);
      let rubLine = '';
      if (data.sr && config.showRub) {
        const rate = await currency.getRate();
        const totalRub = Math.round(currency.kztToRub(totalKzt, rate));
        rubLine = `\n💱 ≈ <b>${totalRub.toLocaleString('ru-RU')} ₽</b>`;
      }

      const msg =
        `✅ <b>Клиент принял КП</b>\n\n` +
        `📄 Номер: <b>${escTg(data.n)}</b>\n` +
        `👤 Клиент: <b>${escTg(data.c)}</b>${data.co ? ` · ${escTg(data.co)}` : ''}\n` +
        `✍️ Подписал: <b>${escTg(signerName)}</b>\n` +
        `💰 Сумма: <b>${totalKzt.toLocaleString('ru-RU')} ₸</b>${rubLine}\n` +
        `🕐 Время (Алматы): ${almatyTime()}`;

      await telegram.sendMessage(msg);
    } catch (notifyErr) {
      console.error('Уведомление не отправлено (принятие всё равно зафиксировано):', notifyErr.message);
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('accept error:', e);
    res.status(400).json({ ok: false, error: e.message || 'Ошибка' });
  }
});

// Экранирование для Telegram HTML
function escTg(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---------- Запуск ----------
// Слушаем порт ТОЛЬКО при локальном запуске. На Vercel экспортируется app.
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n  КП-генератор запущен:  http://localhost:${PORT}\n`);
    if (config.secretIsDefault) {
      console.log('  ⚠️  SECRET_KEY не задан в .env — ссылки подписываются небезопасным ключом.');
      console.log('     Сгенерируй ключ командой:  npm run gen-secret\n');
    }
  });
}

module.exports = app;
