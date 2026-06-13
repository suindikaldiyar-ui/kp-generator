// lib/template.js
// HTML-страница коммерческого предложения для КЛИЕНТА (на русском языке).
// Премиальный адаптивный дизайн. Внутри — клиентский JS для кнопки «Подписать».

// --- Защита от вставки HTML из пользовательских данных ---
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Красивое форматирование чисел: 1 250 000
function fmt(n) {
  const rounded = Math.round(Number(n) || 0);
  return rounded.toLocaleString('ru-RU').replace(/ /g, ' ');
}

// Дата в формате ДД.ММ.ГГГГ
function fmtDate(d) {
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${dt.getFullYear()}`;
}

// Круглая SVG-печать с текстом по кругу.
// variant: 'blue' (наша печать) | 'green' (принято)
function sealSVG(variant, opts = {}) {
  const isGreen = variant === 'green';
  const color = isGreen ? '#0E9F6E' : '#3D5AFE';
  const ringText = (opts.ringText || '').toUpperCase();
  const centerTop = opts.centerTop || '';
  const centerMain = opts.centerMain || '';
  const centerBottom = opts.centerBottom || '';
  const uid = 'seal_' + Math.random().toString(36).slice(2, 8);

  return `
  <svg class="seal seal--${variant}" viewBox="0 0 220 220" width="160" height="160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Печать">
    <defs>
      <path id="${uid}" d="M 110,110 m -82,0 a 82,82 0 1,1 164,0 a 82,82 0 1,1 -164,0" />
    </defs>
    <circle cx="110" cy="110" r="100" fill="none" stroke="${color}" stroke-width="3"/>
    <circle cx="110" cy="110" r="92" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.7"/>
    <circle cx="110" cy="110" r="62" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.7"/>
    <text font-family="'Space Grotesk', sans-serif" font-size="13" font-weight="600" letter-spacing="2" fill="${color}">
      <textPath href="#${uid}" startOffset="0%">${esc(ringText)} • ${esc(ringText)} • </textPath>
    </text>
    ${isGreen
      ? `<path d="M 78,108 l 18,18 l 34,-40" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>`
      : `<circle cx="110" cy="110" r="6" fill="${color}" opacity="0.5"/>`}
    <text x="110" y="${isGreen ? 150 : 100}" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-size="11" font-weight="600" letter-spacing="1" fill="${color}">${esc(centerTop)}</text>
    <text x="110" y="${isGreen ? 168 : 118}" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-size="15" font-weight="700" fill="${color}">${esc(centerMain)}</text>
    <text x="110" y="${isGreen ? 184 : 136}" text-anchor="middle" font-family="'Inter', sans-serif" font-size="10" fill="${color}" opacity="0.85">${esc(centerBottom)}</text>
  </svg>`;
}

// kp — объект с подготовленными данными (см. api/index.js):
// { token, kpNumber, companyName, companyLogoText, clientName, company,
//   services:[{name, priceKzt, priceRub}], totalKzt, totalRub, showRub,
//   createdAt, expiresAt, expired }
function render(kp) {
  const rows = kp.services.map((s, i) => `
    <tr>
      <td class="td-num">${i + 1}</td>
      <td class="td-name">${esc(s.name)}</td>
      <td class="td-price">${fmt(s.priceKzt)} ₸${kp.showRub ? `<span class="rub">≈ ${fmt(s.priceRub)} ₽</span>` : ''}</td>
    </tr>`).join('');

  const ourSeal = sealSVG('blue', {
    ringText: kp.companyName,
    centerTop: 'ПОДПИСАНО',
    centerMain: kp.companyLogoText,
    centerBottom: fmtDate(kp.createdAt),
  });

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Коммерческое предложение ${esc(kp.kpNumber)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#eef2f9; --card:#ffffff; --ink:#0B1120; --muted:#5b6577;
    --indigo:#3D5AFE; --cyan:#22D3EE; --green:#0E9F6E; --line:#e3e8f2;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--ink);line-height:1.55;-webkit-font-smoothing:antialiased}
  .wrap{max-width:860px;margin:0 auto;padding:0 16px 60px}

  /* Шапка */
  .hero{
    background:linear-gradient(135deg,#0B1120 0%,#16213f 100%);
    color:#fff;border-radius:0 0 28px 28px;padding:34px 28px 40px;position:relative;overflow:hidden;
  }
  .hero::after{content:"";position:absolute;right:-60px;top:-60px;width:220px;height:220px;
    background:radial-gradient(circle,rgba(34,211,238,.35),transparent 70%);}
  .hero::before{content:"";position:absolute;left:-40px;bottom:-80px;width:240px;height:240px;
    background:radial-gradient(circle,rgba(61,90,254,.4),transparent 70%);}
  .hero-top{display:flex;align-items:center;justify-content:space-between;gap:16px;position:relative;z-index:1;flex-wrap:wrap}
  .brand{display:flex;align-items:center;gap:14px}
  .logo{width:54px;height:54px;border-radius:14px;display:grid;place-items:center;font-family:'Space Grotesk';font-weight:700;font-size:20px;
    background:linear-gradient(135deg,var(--indigo),var(--cyan));color:#fff;box-shadow:0 8px 24px rgba(61,90,254,.45)}
  .brand .cname{font-family:'Space Grotesk';font-weight:600;font-size:18px}
  .brand .kpno{font-size:13px;color:#9fb0d0;font-family:'JetBrains Mono'}
  .hero h1{font-family:'Space Grotesk';font-weight:700;font-size:30px;margin-top:26px;position:relative;z-index:1;letter-spacing:-.5px}
  .hero .dates{margin-top:10px;display:flex;gap:18px;flex-wrap:wrap;font-size:13px;color:#9fb0d0;position:relative;z-index:1}
  .hero .dates b{color:#cdd9f0;font-weight:500}

  /* Карточки */
  .card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:24px;margin-top:20px;box-shadow:0 6px 24px rgba(13,24,48,.05)}
  .card h2{font-family:'Space Grotesk';font-size:14px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);margin-bottom:16px;font-weight:600}
  .forwhom{font-size:18px;font-weight:600;font-family:'Space Grotesk'}
  .forwhom span{color:var(--muted);font-weight:400;font-size:15px}

  /* Таблица услуг */
  table{width:100%;border-collapse:collapse}
  th{text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);padding:0 8px 12px;font-weight:600}
  td{padding:14px 8px;border-top:1px solid var(--line);vertical-align:top}
  .td-num{color:var(--muted);font-family:'JetBrains Mono';width:32px}
  .td-name{font-weight:500}
  .td-price{text-align:right;font-family:'JetBrains Mono';font-weight:700;white-space:nowrap}
  .td-price .rub{display:block;font-weight:500;font-size:12px;color:var(--muted);margin-top:2px}
  th:last-child{text-align:right}

  /* Итого */
  .total{background:linear-gradient(135deg,#0B1120,#16213f);color:#fff;border-radius:20px;padding:26px;margin-top:20px;text-align:right;position:relative;overflow:hidden}
  .total::after{content:"";position:absolute;left:-30px;top:-30px;width:160px;height:160px;background:radial-gradient(circle,rgba(34,211,238,.25),transparent 70%)}
  .total .lbl{font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:#9fb0d0;position:relative;z-index:1}
  .total .sum{font-family:'JetBrains Mono';font-weight:700;font-size:40px;margin-top:6px;position:relative;z-index:1;letter-spacing:-1px}
  .total .sub{font-family:'JetBrains Mono';font-size:16px;color:var(--cyan);margin-top:4px;position:relative;z-index:1}

  /* Подписи */
  .signs{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:20px}
  .sign{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:24px;text-align:center;display:flex;flex-direction:column;align-items:center;box-shadow:0 6px 24px rgba(13,24,48,.05)}
  .sign h3{font-family:'Space Grotesk';font-size:13px;text-transform:uppercase;letter-spacing:1.2px;color:var(--muted);margin-bottom:16px;font-weight:600}
  .seal{margin:4px 0 8px}
  .sign .who{font-weight:600;margin-top:6px}
  .sign .role{font-size:13px;color:var(--muted)}
  .field{width:100%;margin-top:14px}
  .field input{width:100%;padding:13px 14px;border:1.5px solid var(--line);border-radius:12px;font-size:15px;font-family:'Inter';outline:none;transition:.15s}
  .field input:focus{border-color:var(--indigo);box-shadow:0 0 0 4px rgba(61,90,254,.12)}
  .btn{width:100%;margin-top:12px;padding:15px;border:0;border-radius:12px;font-size:16px;font-weight:600;font-family:'Space Grotesk';cursor:pointer;transition:.15s;
    background:linear-gradient(135deg,var(--indigo),var(--cyan));color:#fff;box-shadow:0 8px 22px rgba(61,90,254,.4)}
  .btn:hover{transform:translateY(-1px)}
  .btn:disabled{cursor:default;transform:none}
  .btn.done{background:var(--green);box-shadow:0 8px 22px rgba(14,159,110,.35)}
  .accepted-box{display:none;flex-direction:column;align-items:center;width:100%}
  .accepted-box .who{color:var(--green);font-weight:700;font-size:16px}
  .accepted-box .when{font-size:13px;color:var(--muted)}
  .err{color:#d33;font-size:13px;margin-top:8px;min-height:16px}

  .expired{background:#fff4f4;border:1px solid #ffd5d5;color:#b42318;border-radius:16px;padding:16px;margin-top:20px;text-align:center;font-weight:500}
  footer{text-align:center;color:var(--muted);font-size:12px;margin-top:30px}

  @media(max-width:640px){
    .hero{padding:26px 18px 32px;border-radius:0 0 22px 22px}
    .hero h1{font-size:24px}
    .total .sum{font-size:30px}
    .signs{grid-template-columns:1fr}
    .card,.total{padding:20px}
  }
</style>
</head>
<body>
  <div class="hero">
    <div class="hero-top">
      <div class="brand">
        <div class="logo">${esc(kp.companyLogoText)}</div>
        <div>
          <div class="cname">${esc(kp.companyName)}</div>
          <div class="kpno">КП ${esc(kp.kpNumber)}</div>
        </div>
      </div>
    </div>
    <h1>Коммерческое предложение</h1>
    <div class="dates">
      <div>Дата: <b>${fmtDate(kp.createdAt)}</b></div>
      <div>Действительно до: <b>${fmtDate(kp.expiresAt)}</b></div>
    </div>
  </div>

  <div class="wrap">
    <div class="card">
      <h2>Подготовлено для</h2>
      <div class="forwhom">${esc(kp.clientName)}${kp.company ? ` <span>· ${esc(kp.company)}</span>` : ''}</div>
    </div>

    <div class="card">
      <h2>Состав предложения</h2>
      <table>
        <thead><tr><th>№</th><th>Услуга</th><th>Стоимость</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="total">
      <div class="lbl">Итого к оплате</div>
      <div class="sum">${fmt(kp.totalKzt)} ₸</div>
      ${kp.showRub ? `<div class="sub">≈ ${fmt(kp.totalRub)} ₽</div>` : ''}
    </div>

    ${kp.expired ? `<div class="expired">⚠️ Срок действия этого предложения истёк (${fmtDate(kp.expiresAt)}). Свяжитесь с нами для актуальных условий.</div>` : ''}

    <div class="signs">
      <div class="sign">
        <h3>Исполнитель</h3>
        ${ourSeal}
        <div class="who">${esc(kp.companyName)}</div>
        <div class="role">Подписано электронной печатью</div>
      </div>

      <div class="sign">
        <h3>Заказчик</h3>
        <div id="customerArea">
          <div class="seal" id="placeholderSeal" style="opacity:.25">${sealSVG('green', { ringText: 'ОЖИДАЕТ ПОДПИСИ', centerTop: '', centerMain: '?', centerBottom: '' })}</div>
          <div class="field">
            <input id="nameInput" type="text" placeholder="Ваше имя (подпись)" autocomplete="name">
          </div>
          <button class="btn" id="acceptBtn">Принять условия (Подписать)</button>
          <div class="err" id="errMsg"></div>
        </div>

        <div class="accepted-box" id="acceptedBox">
          ${sealSVG('green', { ringText: 'УСЛОВИЯ ПРИНЯТЫ', centerTop: 'ПРИНЯТО', centerMain: '', centerBottom: '' })}
          <div class="who" id="acceptedName"></div>
          <div class="when" id="acceptedWhen"></div>
        </div>
      </div>
    </div>

    <footer>${esc(kp.companyName)} · Документ сформирован автоматически</footer>
  </div>

<script>
  var TOKEN = ${JSON.stringify(kp.token)};
  var EXPIRED = ${kp.expired ? 'true' : 'false'};
  var btn = document.getElementById('acceptBtn');
  var nameInput = document.getElementById('nameInput');
  var errMsg = document.getElementById('errMsg');

  if (EXPIRED) {
    btn.disabled = true;
    btn.textContent = 'Срок истёк';
    btn.style.background = '#9aa3b2';
    btn.style.boxShadow = 'none';
  }

  function showAccepted(name, whenText) {
    document.getElementById('customerArea').style.display = 'none';
    var box = document.getElementById('acceptedBox');
    box.style.display = 'flex';
    document.getElementById('acceptedName').textContent = name;
    document.getElementById('acceptedWhen').textContent = whenText;
  }

  btn.addEventListener('click', async function () {
    errMsg.textContent = '';
    var name = nameInput.value.trim();
    if (!name) {
      errMsg.textContent = 'Пожалуйста, введите имя для подписи.';
      nameInput.focus();
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Отправляем…';
    try {
      var res = await fetch('/api/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: TOKEN, name: name })
      });
      var data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Не удалось отправить');

      btn.classList.add('done');
      btn.textContent = '✓ Условия приняты';
      var now = new Date();
      var when = now.toLocaleDateString('ru-RU') + ' ' + now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      showAccepted(name, 'Подписано: ' + when);
    } catch (e) {
      btn.disabled = false;
      btn.textContent = 'Принять условия (Подписать)';
      errMsg.textContent = 'Ошибка: ' + e.message + '. Попробуйте ещё раз.';
    }
  });
</script>
</body>
</html>`;
}

module.exports = { render, esc, fmt, fmtDate };
