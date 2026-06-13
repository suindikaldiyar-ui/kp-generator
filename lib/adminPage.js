// lib/adminPage.js
// HTML формы создания КП — это ТВОЙ интерфейс (на казахском языке).
// Динамический список услуг, живой подсчёт суммы, блок результата со ссылкой.

function render(opts = {}) {
  const needPassword = !!opts.needPassword;
  const showRubDefault = opts.showRubDefault !== false;
  const defaultValidDays = opts.defaultValidDays || 14;
  const companyName = opts.companyName || 'Менің компаниям';

  return `<!DOCTYPE html>
<html lang="kk">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>КП жасау — ${esc(companyName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
<style>
  :root{--bg:#eef2f9;--card:#fff;--ink:#0B1120;--muted:#5b6577;--indigo:#3D5AFE;--cyan:#22D3EE;--green:#0E9F6E;--line:#e3e8f2}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--ink);line-height:1.5}
  .wrap{max-width:720px;margin:0 auto;padding:0 16px 60px}
  .hero{background:linear-gradient(135deg,#0B1120,#16213f);color:#fff;border-radius:0 0 26px 26px;padding:28px 24px;position:relative;overflow:hidden}
  .hero::after{content:"";position:absolute;right:-50px;top:-50px;width:180px;height:180px;background:radial-gradient(circle,rgba(34,211,238,.35),transparent 70%)}
  .hero h1{font-family:'Space Grotesk';font-size:24px;position:relative;z-index:1}
  .hero p{color:#9fb0d0;font-size:14px;margin-top:4px;position:relative;z-index:1}
  .card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:22px;margin-top:18px;box-shadow:0 6px 24px rgba(13,24,48,.05)}
  label{display:block;font-size:13px;font-weight:600;color:var(--muted);margin-bottom:6px}
  input[type=text],input[type=number],input[type=password]{width:100%;padding:12px 14px;border:1.5px solid var(--line);border-radius:12px;font-size:15px;font-family:'Inter';outline:none;transition:.15s;background:#fff}
  input:focus{border-color:var(--indigo);box-shadow:0 0 0 4px rgba(61,90,254,.12)}
  .row2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .field{margin-bottom:16px}
  h2.sec{font-family:'Space Grotesk';font-size:14px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:14px}
  .svc{display:grid;grid-template-columns:1fr 150px 44px;gap:10px;margin-bottom:10px;align-items:center}
  .svc input.price{font-family:'JetBrains Mono';font-weight:700;text-align:right}
  .del{width:44px;height:44px;border:1.5px solid var(--line);background:#fff;border-radius:12px;cursor:pointer;font-size:18px;color:#c0392b;transition:.15s}
  .del:hover{background:#fff4f4;border-color:#ffd5d5}
  .addbtn{margin-top:6px;background:#fff;border:1.5px dashed var(--indigo);color:var(--indigo);padding:11px;border-radius:12px;width:100%;cursor:pointer;font-weight:600;font-family:'Space Grotesk';transition:.15s}
  .addbtn:hover{background:rgba(61,90,254,.06)}
  .totbar{display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:16px;border-top:1px solid var(--line)}
  .totbar .lbl{font-size:13px;text-transform:uppercase;letter-spacing:1px;color:var(--muted)}
  .totbar .val{font-family:'JetBrains Mono';font-weight:700;font-size:26px}
  .check{display:flex;align-items:center;gap:10px;margin-top:6px}
  .check input{width:20px;height:20px;accent-color:var(--indigo)}
  .check label{margin:0;color:var(--ink);font-weight:500}
  .btn{width:100%;margin-top:8px;padding:16px;border:0;border-radius:14px;font-size:17px;font-weight:700;font-family:'Space Grotesk';cursor:pointer;color:#fff;background:linear-gradient(135deg,var(--indigo),var(--cyan));box-shadow:0 8px 22px rgba(61,90,254,.4);transition:.15s}
  .btn:hover{transform:translateY(-1px)}
  .btn:disabled{opacity:.6;cursor:default;transform:none}
  .result{display:none;border:1px solid var(--green);background:#f0fbf6}
  .result h2.sec{color:var(--green)}
  .linkbox{display:flex;gap:8px;margin-bottom:12px}
  .linkbox input{font-family:'JetBrains Mono';font-size:13px}
  .mini{padding:12px 14px;border-radius:12px;font-weight:600;font-family:'Space Grotesk';cursor:pointer;border:0;font-size:14px;white-space:nowrap;transition:.15s}
  .mini.copy{background:var(--indigo);color:#fff}
  .mini.wa{background:var(--green);color:#fff;flex:1;text-align:center;text-decoration:none;display:inline-block}
  .mini.open{background:#fff;border:1.5px solid var(--line);color:var(--ink);flex:1;text-align:center;text-decoration:none;display:inline-block}
  .actions{display:flex;gap:8px}
  .err{color:#d33;font-size:14px;margin-top:10px;min-height:18px}
  @media(max-width:560px){.row2{grid-template-columns:1fr}.svc{grid-template-columns:1fr 110px 44px}}
</style>
</head>
<body>
  <div class="hero">
    <h1>Коммерциялық ұсыныс жасау</h1>
    <p>${esc(companyName)} · форманы толтырыңыз да, сілтеме алыңыз</p>
  </div>

  <div class="wrap">
    <div class="card" id="formCard">
      ${needPassword ? `
      <div class="field">
        <label>Құпиясөз</label>
        <input type="password" id="adminPassword" placeholder="Әкімші құпиясөзі">
      </div>` : ''}

      <div class="row2">
        <div class="field">
          <label>Клиенттің аты</label>
          <input type="text" id="clientName" placeholder="Мысалы: Айбек Серіков">
        </div>
        <div class="field">
          <label>Компания (міндетті емес)</label>
          <input type="text" id="company" placeholder="ЖШС «Мысал»">
        </div>
      </div>

      <h2 class="sec">Қызметтер</h2>
      <div id="services"></div>
      <button class="addbtn" id="addBtn" type="button">+ Жол қосу</button>

      <div class="totbar">
        <div class="lbl">Жалпы сома</div>
        <div class="val" id="totalView">0 ₸</div>
      </div>

      <div class="row2" style="margin-top:18px">
        <div class="field" style="margin:0">
          <label>Жарамдылық мерзімі (күн)</label>
          <input type="number" id="validDays" value="${defaultValidDays}" min="1" max="365">
        </div>
        <div class="field" style="margin:0;display:flex;align-items:flex-end">
          <div class="check">
            <input type="checkbox" id="showRub" ${showRubDefault ? 'checked' : ''}>
            <label for="showRub">Рубльді көрсету (₽)</label>
          </div>
        </div>
      </div>

      <button class="btn" id="createBtn" type="button" style="margin-top:18px">КП жасау →</button>
      <div class="err" id="errMsg"></div>
    </div>

    <div class="card result" id="resultCard">
      <h2 class="sec">✓ Сілтеме дайын!</h2>
      <div class="linkbox">
        <input type="text" id="resultLink" readonly>
        <button class="mini copy" id="copyBtn" type="button">Көшіру</button>
      </div>
      <div class="actions">
        <a class="mini wa" id="waBtn" target="_blank" rel="noopener">WhatsApp арқылы жіберу</a>
        <a class="mini open" id="openBtn" target="_blank" rel="noopener">Ашу</a>
      </div>
    </div>
  </div>

<script>
  var servicesEl = document.getElementById('services');
  var totalView = document.getElementById('totalView');

  function addRow(name, price) {
    var row = document.createElement('div');
    row.className = 'svc';
    row.innerHTML =
      '<input type="text" class="sname" placeholder="Қызмет атауы">' +
      '<input type="number" class="price" placeholder="Бағасы ₸" min="0">' +
      '<button type="button" class="del" title="Жою">×</button>';
    servicesEl.appendChild(row);
    if (name) row.querySelector('.sname').value = name;
    if (price) row.querySelector('.price').value = price;
    row.querySelector('.del').addEventListener('click', function () {
      row.remove();
      recalc();
    });
    row.querySelector('.price').addEventListener('input', recalc);
  }

  function recalc() {
    var total = 0;
    document.querySelectorAll('.price').forEach(function (i) {
      total += parseFloat(i.value) || 0;
    });
    totalView.textContent = total.toLocaleString('ru-RU') + ' ₸';
  }

  function collectServices() {
    var list = [];
    document.querySelectorAll('.svc').forEach(function (row) {
      var name = row.querySelector('.sname').value.trim();
      var price = parseFloat(row.querySelector('.price').value) || 0;
      if (name && price > 0) list.push({ name: name, price: price });
    });
    return list;
  }

  document.getElementById('addBtn').addEventListener('click', function () { addRow(); });

  // Стартовые 2 пустые строки
  addRow();
  addRow();

  var createBtn = document.getElementById('createBtn');
  var errMsg = document.getElementById('errMsg');

  createBtn.addEventListener('click', async function () {
    errMsg.textContent = '';
    var clientName = document.getElementById('clientName').value.trim();
    var company = document.getElementById('company').value.trim();
    var services = collectServices();
    var validDays = parseInt(document.getElementById('validDays').value, 10) || 14;
    var showRub = document.getElementById('showRub').checked;
    var adminPassword = ${needPassword ? "document.getElementById('adminPassword').value" : "''"};

    if (!clientName) { errMsg.textContent = 'Клиенттің атын енгізіңіз.'; return; }
    if (services.length === 0) { errMsg.textContent = 'Кемінде бір қызмет пен бағасын қосыңыз.'; return; }

    createBtn.disabled = true;
    createBtn.textContent = 'Жасалуда…';
    try {
      var res = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: clientName, company: company, services: services, validDays: validDays, showRub: showRub, adminPassword: adminPassword })
      });
      var data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Қате');

      var fullLink = location.origin + data.link;
      document.getElementById('resultLink').value = fullLink;
      document.getElementById('openBtn').href = fullLink;

      var waText = 'Сәлеметсіз бе! Сіз үшін коммерциялық ұсыныс дайын: ' + fullLink;
      document.getElementById('waBtn').href = 'https://wa.me/?text=' + encodeURIComponent(waText);

      document.getElementById('resultCard').style.display = 'block';
      document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
      errMsg.textContent = 'Қате: ' + e.message;
    } finally {
      createBtn.disabled = false;
      createBtn.textContent = 'КП жасау →';
    }
  });

  document.getElementById('copyBtn').addEventListener('click', function () {
    var inp = document.getElementById('resultLink');
    inp.select();
    navigator.clipboard.writeText(inp.value).then(function () {
      var b = document.getElementById('copyBtn');
      b.textContent = '✓ Көшірілді';
      setTimeout(function () { b.textContent = 'Көшіру'; }, 1500);
    });
  });
</script>
</body>
</html>`;
}

// Локальная защита от HTML-инъекций в подставляемых значениях.
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

module.exports = { render };
