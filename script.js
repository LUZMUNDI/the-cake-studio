/* ============================================================
   THE CAKE STUDIO — Shared JavaScript
   Mobile nav · scroll reveal · FAQ accordion ·
   Multi-product order cart · WhatsApp message builder
   ============================================================ */

// Plain "click to chat" preset link (floating button / contact CTAs)
const WA_LINK = 'https://wa.me/message/6TMTI4ZZF26OK1';
// Phone-number link — reliably supports a pre-filled ?text= order message
const WA_PHONE = 'https://wa.me/56926937751';

// Tortas need a minimum 72-hour (3-day) lead time.
const TORTA_LEAD_DAYS = 3;

/* ---------- Product catalog (price in CLP, null = "Consultar") ---------- */
const CATALOG = [
  { g: '🎂 Tortas', torta: true, items: [
    { name: 'Chocoquesillo (Sin Gluten)', price: null },
    { name: 'Torta Rose', price: 45000 },
    { name: 'Torta Brownie Cotillón', price: 47990 },
    { name: 'Torta ILove', price: 47990 },
    { name: 'Torta Isaias', price: 41990 },
    { name: 'Torta Maceta', price: 14990 },
    { name: 'Torta Nona', price: 70000 },
    { name: 'Cheesecake de Frambuesa', price: 29990 },
    { name: 'Chocoquesillo Familiar', price: 47600 },
  ]},
  { g: '🍮 Postres', items: [
    { name: 'Tres Leches', price: 6990 },
    { name: 'Mini Chocoquesillo', price: 10400 },
    { name: 'Mini Postres Shots (mín. 6)', price: 1500 },
    { name: 'Mini Postres Gourmet Shot (mín. 6)', price: 1800 },
    { name: 'Cheesecake de Chocolate', price: 4990 },
    { name: 'Roll de Canela', price: 3990 },
    { name: 'Marble Cake', price: null },
    { name: 'Red Velvet', price: 4990 },
    { name: 'Volcán de Chocolate (2 uni)', price: 4990 },
    { name: 'Pie de Limón', price: 2990 },
    { name: 'Brownie (2 uni)', price: 3500 },
    { name: 'Pinguinito (3 uni)', price: 3990 },
  ]},
  { g: '🧁 Muffins y Magdalenas', items: [
    { name: 'Muffin Chips de Chocolate (2 uni)', price: 4990 },
    { name: 'Magdalena (2 uni)', price: 2500 },
    { name: 'Cupcake (2 uni)', price: 3990 },
  ]},
  { g: '🍪 Galletas', items: [
    { name: 'Galletitas Pasta Seca (200g)', price: 6500 },
    { name: 'Galleta New York', price: 2990 },
    { name: 'Galletas Craqueladas', price: 10990 },
  ]},
  { g: '🥐 Bollería Venezolana', items: [
    { name: 'Golfeados (2 uni)', price: 4990 },
  ]},
  { g: '🥧 Salado', items: [
    { name: 'Cachito de Jamón', price: 3590 },
    { name: 'Empanada de Pino', price: 4990 },
    { name: 'Pan de Jamón 20cm', price: 12990 },
    { name: 'Pan de Jamón 40cm', price: 25990 },
  ]},
];

// Flat lookup: name -> { price, torta }
const PRODUCTS = {};
CATALOG.forEach(group => group.items.forEach(it => {
  PRODUCTS[it.name] = { price: it.price, torta: !!group.torta };
}));

function isTortaName(name) { return !!(PRODUCTS[name] && PRODUCTS[name].torta); }
function formatCLP(n) { return '$' + Number(n).toLocaleString('es-CL'); }
function isoPlusDays(n) {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}
function formatDate(iso) {
  if (!iso) return iso;
  const [y, m, day] = iso.split('-');
  return `${day}/${m}/${y}`;
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initReveal();
  initFaq();
  initOrderCart();
});

/* ---------- Mobile navigation ---------- */
function initNav() {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => { links.classList.toggle('open'); nav.classList.toggle('open'); });
  links.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => { links.classList.remove('open'); nav.classList.remove('open'); })
  );
}

/* ---------- Reveal on scroll ---------- */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || !els.length) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  els.forEach(e => io.observe(e));
}

/* ---------- FAQ accordion ---------- */
function initFaq() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', () => {
      const open = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(o => { o.classList.remove('open'); o.querySelector('.faq-a').style.maxHeight = null; });
      if (!open) { item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
    });
  });
}

/* ============================================================
   MULTI-PRODUCT ORDER CART
   ============================================================ */
function initOrderCart() {
  const form = document.getElementById('orderForm');
  if (!form) return;

  const rowsWrap = form.querySelector('#cartRows');
  const addBtn = form.querySelector('#addRow');
  const breakdown = form.querySelector('#cartBreakdown');
  const totalEl = form.querySelector('#cartTotal');
  const consultarNote = form.querySelector('#consultarNote');
  const dateEl = form.querySelector('input[name="fecha"]');
  const leadNote = form.querySelector('[data-lead-note]');
  const leadError = form.querySelector('[data-lead-error]');
  const submitBtn = form.querySelector('#submitBtn');
  const comunaWrap = form.querySelector('.comuna-wrap');
  const comunaInput = comunaWrap ? comunaWrap.querySelector('input') : null;

  // Build the <option> markup once and clone per row.
  const optionsHTML = '<option value="" disabled selected>Selecciona un producto…</option>' +
    CATALOG.map(group =>
      `<optgroup label="${group.g}">` +
      group.items.map(it => `<option value="${it.name}">${it.name}</option>`).join('') +
      '</optgroup>'
    ).join('');

  function addRow(preselect) {
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML =
      `<select class="row-product" aria-label="Producto">${optionsHTML}</select>` +
      `<input class="row-qty" type="number" min="1" value="1" aria-label="Cantidad">` +
      `<button type="button" class="row-remove" aria-label="Quitar producto">✕</button>` +
      `<span class="row-subtotal"></span>`;
    rowsWrap.appendChild(row);
    if (preselect && PRODUCTS[preselect]) row.querySelector('.row-product').value = preselect;

    row.querySelector('.row-product').addEventListener('change', update);
    row.querySelector('.row-qty').addEventListener('input', update);
    row.querySelector('.row-remove').addEventListener('click', () => { row.remove(); update(); });
    update();
  }

  function readCart() {
    return [...rowsWrap.querySelectorAll('.cart-row')].map(row => {
      const name = row.querySelector('.row-product').value;
      let qty = parseInt(row.querySelector('.row-qty').value, 10);
      if (!qty || qty < 1) qty = 1;
      const info = PRODUCTS[name];
      return { row, name, qty, price: info ? info.price : undefined, torta: info ? info.torta : false };
    });
  }

  function update() {
    const cart = readCart();
    let total = 0, hasConsultar = false, hasTorta = false, validItems = 0;

    // Per-row subtotals
    cart.forEach(it => {
      const subEl = it.row.querySelector('.row-subtotal');
      if (!it.name) { subEl.textContent = ''; return; }
      validItems++;
      if (it.torta) hasTorta = true;
      if (it.price == null) { subEl.innerHTML = '<small>A confirmar</small>'; hasConsultar = true; }
      else { const sub = it.price * it.qty; total += sub; subEl.textContent = formatCLP(sub); }
    });

    // Breakdown + total
    breakdown.innerHTML = cart.filter(it => it.name).map(it =>
      `<div class="bd-row"><span>${it.qty}× ${it.name}</span><span>${it.price == null ? 'A confirmar' : formatCLP(it.price * it.qty)}</span></div>`
    ).join('');
    totalEl.textContent = formatCLP(total);
    consultarNote.classList.toggle('field-hidden', !hasConsultar);

    // Only one "remove" left disabled when a single row remains
    const removeBtns = rowsWrap.querySelectorAll('.row-remove');
    removeBtns.forEach(b => b.disabled = removeBtns.length <= 1);

    // 72h lead-time rule (active if any torta is in the cart)
    const minISO = isoPlusDays(TORTA_LEAD_DAYS);
    dateEl.min = hasTorta ? minISO : isoPlusDays(0);
    if (leadNote) leadNote.classList.toggle('field-hidden', !hasTorta);

    // Too soon = a date is chosen but earlier than the 72h minimum (shows red error).
    const dateTooSoon = hasTorta && !!dateEl.value && dateEl.value < minISO;
    // A torta with no date yet also keeps the order locked (no red error shown).
    const dateBlocksTorta = hasTorta && (!dateEl.value || dateEl.value < minISO);
    dateEl.classList.toggle('input-error', dateTooSoon);
    if (leadError) {
      leadError.classList.toggle('field-hidden', !dateTooSoon);
      if (dateTooSoon) leadError.textContent =
        `Las tortas requieren un mínimo de 72 horas de anticipación. La fecha más próxima disponible es ${formatDate(minISO)}.`;
    }

    // Enable submit only with items and (no torta OR a valid future date)
    const blocked = validItems === 0 || dateBlocksTorta;
    submitBtn.disabled = blocked;
    submitBtn.classList.toggle('is-disabled', blocked);
    form.dataset.torta = hasTorta ? '1' : '0';
  }

  // Delivery / pickup toggle
  form.querySelectorAll('input[name="entrega"]').forEach(r => r.addEventListener('change', () => {
    form.querySelectorAll('.radio-chip').forEach(c => c.classList.remove('sel'));
    const chip = r.closest('.radio-chip'); if (chip) chip.classList.add('sel');
    if (comunaWrap) {
      const isDelivery = r.value === 'Delivery';
      comunaWrap.classList.toggle('field-hidden', !isDelivery);
      if (comunaInput) comunaInput.required = isDelivery;
    }
  }));

  dateEl.addEventListener('change', update);
  addBtn.addEventListener('click', () => addRow());

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = buildCartMessage(form);
    if (!msg) return;
    window.open(`${WA_PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
  });

  // Seed the first row (optionally preloaded via ?add=Producto)
  const params = new URLSearchParams(location.search);
  const add = params.get('add');
  addRow(add && PRODUCTS[add] ? add : null);
}

/* ---------- Build the WhatsApp order message ---------- */
function buildCartMessage(form) {
  const cart = [...form.querySelectorAll('.cart-row')]
    .map(row => {
      const name = row.querySelector('.row-product').value;
      let qty = parseInt(row.querySelector('.row-qty').value, 10);
      if (!qty || qty < 1) qty = 1;
      const info = PRODUCTS[name];
      return name ? { name, qty, price: info ? info.price : null } : null;
    })
    .filter(Boolean);

  if (!cart.length) { alert('Agrega al menos un producto a tu pedido.'); return null; }

  const nombre = (form.querySelector('[name="nombre"]').value || '').trim();
  const fecha = form.querySelector('[name="fecha"]').value;
  const nota = (form.querySelector('[name="nota"]').value || '').trim();
  const entregaEl = form.querySelector('input[name="entrega"]:checked');

  if (!nombre) { alert('Por favor escribe tu nombre.'); form.querySelector('[name="nombre"]').focus(); return null; }
  if (!fecha) { alert('Por favor elige una fecha.'); form.querySelector('[name="fecha"]').focus(); return null; }
  if (!entregaEl) { alert('Por favor elige cómo recibir tu pedido.'); return null; }

  // 72h guard for tortas
  const hasTorta = cart.some(it => isTortaName(it.name));
  if (hasTorta && fecha < isoPlusDays(TORTA_LEAD_DAYS)) {
    alert(`Las tortas requieren un mínimo de 72 horas de anticipación. La fecha más próxima disponible es ${formatDate(isoPlusDays(TORTA_LEAD_DAYS))}.`);
    return null;
  }

  let comuna = '';
  const isDelivery = entregaEl.value === 'Delivery';
  if (isDelivery) {
    comuna = (form.querySelector('[name="comuna"]').value || '').trim();
    if (!comuna) { alert('Por favor indica la comuna para el delivery.'); return null; }
  }

  let total = 0, hasConsultar = false;
  const lines = cart.map(it => {
    if (it.price == null) { hasConsultar = true; return `- ${it.qty}x ${it.name} — Precio a confirmar`; }
    const sub = it.price * it.qty; total += sub;
    return `- ${it.qty}x ${it.name} — ${formatCLP(sub)}`;
  });

  let msg = `Hola! Quiero hacer un pedido 🎂\n\n${lines.join('\n')}\n\n`;
  msg += `Total estimado: ${formatCLP(total)}`;
  if (hasConsultar) msg += ` (+ productos a confirmar)`;
  msg += `\n${isDelivery ? '(Delivery a coordinar)' : '(Retiro en local)'}\n\n`;
  msg += `Nombre: ${nombre}\nFecha deseada: ${formatDate(fecha)}`;
  if (isDelivery) msg += `\nComuna: ${comuna}`;
  if (nota) msg += `\nNota al chef: ${nota}`;
  return msg;
}
