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
    { name: 'Torta Rose', price: 45000 },
    { name: 'Torta Brownie Cotillón', price: 47990 },
    { name: 'Torta ILove', price: 47990 },
    { name: 'Torta Isaias', price: 41990 },
    { name: 'Torta Maceta', price: 14990 },
    { name: 'Torta Nona', price: 70000 },
    { name: 'Cheesecake de Frambuesa', price: 29990 },
    { name: 'Chocoquesillo Familiar', price: null },
  ]},
  { g: '🍮 Postres', items: [
    { name: 'Tres Leches', price: 6990 },
    { name: 'Mini Chocoquesillo', price: 10400 },
    { name: 'Mini Postres Shots (mín. 6)', price: 1500, min: 6 },
    { name: 'Mini Postres Gourmet Shot (mín. 6)', price: 1800, min: 6 },
    { name: 'Cheesecake de Frambuesa (porción)', price: 5990 },
    { name: 'Cheesecake de Chocolate', price: 5990 },
    { name: 'Roll de Canela', price: 3990 },
    { name: 'Marble Cake', price: 4500 },
    { name: 'Red Velvet', price: 5990 },
    { name: 'Volcán de Chocolate (2 uni)', price: 4990 },
    { name: 'Pie de Limón', price: 2990 },
    { name: 'Brownie (2 uni)', price: 3500 },
    { name: 'Pinguinito (3 uni)', price: 3990 },
  ]},
  { g: '🧁 Muffins y Magdalenas', items: [
    { name: 'Muffin Chips de Chocolate (2 uni)', price: 4990 },
    { name: 'Magdalena (2 uni)', price: 2500 },
    { name: 'Cupcake (2 uni)', price: 4990 },
  ]},
  { g: '🍪 Galletas', items: [
    { name: 'Galletitas Pasta Seca (200g)', price: 6500 },
    { name: 'Galleta New York', price: 2990, min: 4 },
    { name: 'Galletas Craqueladas (200g)', price: 5990 },
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

// Flat lookup: name -> { price, torta, min }
const PRODUCTS = {};
CATALOG.forEach(group => group.items.forEach(it => {
  PRODUCTS[it.name] = { price: it.price, torta: !!group.torta, min: it.min || 1 };
}));
function minQtyFor(name) { return (PRODUCTS[name] && PRODUCTS[name].min) || 1; }

function isTortaName(name) { return !!(PRODUCTS[name] && PRODUCTS[name].torta); }
function formatCLP(n) { return '$' + Number(n).toLocaleString('es-CL'); }
// Local-date ISO (YYYY-MM-DD) for today + n days.
// Uses local components — NOT toISOString(), which shifts to UTC and can drop a
// day in timezones ahead of UTC (that made the 72h rule leave the 3rd day open).
function isoPlusDays(n) {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function formatDate(iso) {
  if (!iso) return iso;
  const [y, m, day] = iso.split('-');
  return `${day}/${m}/${y}`;
}

/* ---------- Real-name validation ---------- */
function isValidName(raw) {
  const name = (raw || '').trim().replace(/\s+/g, ' ');
  if (!name) return false;
  const words = name.split(' ');
  if (words.length < 2) return false;                       // nombre + apellido
  const onlyLetters = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+$/;
  for (const w of words) {
    if (w.length < 3) return false;                         // 3+ chars per word
    if (!onlyLetters.test(w)) return false;                 // letters/accents/ñ/ü only
  }
  const low = name.toLowerCase();
  const joined = low.replace(/ /g, '');
  const blacklist = ['test', 'prueba', 'asdf', 'xxxx', 'aaaa', 'ninguno', 'anonimo', 'unknown', 'fake', 'hola'];
  if (words.some(w => blacklist.includes(w)) || blacklist.includes(joined)) return false;
  const seqs = ['aaa', 'xxx', 'asdf', 'qwerty', 'zxcv'];
  if (seqs.some(s => joined.includes(s))) return false;     // keyboard walks / repeats
  if (/(.)\1\1/.test(joined)) return false;                 // any char repeated 3+ times
  return true;
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initReveal();
  initFaq();
  initHeroCarousel();
  initMenuAccordion();
  initOrderCart();
});

/* ---------- Hero photo carousel (auto fade, no controls) ---------- */
function initHeroCarousel() {
  const slides = document.querySelectorAll('.hero-carousel .hc-slide');
  if (slides.length < 2) return;
  // Respect users who prefer reduced motion: show the first photo only.
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let i = 0;
  setInterval(() => {
    slides[i].classList.remove('is-active');
    i = (i + 1) % slides.length;
    slides[i].classList.add('is-active');
  }, 3500);
}

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

/* ---------- Menu category accordions (expanded by default) ---------- */
function initMenuAccordion() {
  const blocks = document.querySelectorAll('.cat-block');
  if (!blocks.length) return;
  blocks.forEach(block => {
    const title = block.querySelector('.cat-title');
    const grid = block.querySelector('.menu-grid');
    if (!title || !grid) return;

    const tog = document.createElement('span');
    tog.className = 'cat-toggle';
    tog.setAttribute('aria-hidden', 'true');
    tog.textContent = '▼';
    title.appendChild(tog);

    title.setAttribute('role', 'button');
    title.setAttribute('tabindex', '0');
    title.setAttribute('aria-expanded', 'true');

    const toggle = () => {
      const isOpen = !block.classList.contains('collapsed');
      grid.style.overflow = 'hidden';
      if (isOpen) {                                   // collapse
        grid.style.maxHeight = grid.scrollHeight + 'px';
        requestAnimationFrame(() => requestAnimationFrame(() => { grid.style.maxHeight = '0px'; }));
        block.classList.add('collapsed');
        title.setAttribute('aria-expanded', 'false');
      } else {                                        // expand
        block.classList.remove('collapsed');
        title.setAttribute('aria-expanded', 'true');
        grid.style.maxHeight = grid.scrollHeight + 'px';
        const done = (ev) => {
          if (ev.propertyName !== 'max-height') return;
          grid.style.maxHeight = 'none';
          grid.style.overflow = '';                   // restore so hover shadows aren't clipped
          grid.removeEventListener('transitionend', done);
        };
        grid.addEventListener('transitionend', done);
      }
    };

    title.addEventListener('click', toggle);
    title.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
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
  const nameInput = form.querySelector('[name="nombre"]');
  const nameError = form.querySelector('[data-name-error]');

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
    const prodSel = row.querySelector('.row-product');
    const qtyInp = row.querySelector('.row-qty');

    if (preselect && PRODUCTS[preselect]) {
      prodSel.value = preselect;
      const pmin = minQtyFor(preselect);
      qtyInp.min = pmin; qtyInp.value = pmin;
    }

    // Selecting a product snaps the quantity up to that product's minimum.
    prodSel.addEventListener('change', () => {
      const pmin = minQtyFor(prodSel.value);
      qtyInp.min = pmin;
      if (!qtyInp.value || parseInt(qtyInp.value, 10) < pmin) qtyInp.value = pmin;
      update();
    });
    qtyInp.addEventListener('input', update);
    // Clamp back up to the minimum when the field loses focus.
    qtyInp.addEventListener('blur', () => {
      const pmin = minQtyFor(prodSel.value);
      if (!qtyInp.value || parseInt(qtyInp.value, 10) < pmin) qtyInp.value = pmin;
      update();
    });
    row.querySelector('.row-remove').addEventListener('click', () => { row.remove(); update(); });
    update();
  }

  function readCart() {
    return [...rowsWrap.querySelectorAll('.cart-row')].map(row => {
      const name = row.querySelector('.row-product').value;
      let qty = parseInt(row.querySelector('.row-qty').value, 10);
      if (!qty || qty < 1) qty = 1;
      const info = PRODUCTS[name];
      return { row, name, qty, price: info ? info.price : undefined, torta: info ? info.torta : false, min: minQtyFor(name) };
    });
  }

  function update() {
    const cart = readCart();
    let total = 0, hasConsultar = false, hasTorta = false, validItems = 0, belowMin = false;

    // Per-row subtotals
    cart.forEach(it => {
      const subEl = it.row.querySelector('.row-subtotal');
      const qtyInp = it.row.querySelector('.row-qty');
      if (!it.name) { subEl.textContent = ''; qtyInp.min = 1; return; }
      qtyInp.min = it.min;
      validItems++;
      if (it.torta) hasTorta = true;
      const belowThis = it.qty < it.min;
      if (belowThis) belowMin = true;
      qtyInp.classList.toggle('input-error', belowThis);
      const hint = it.min > 1 ? `<small>mín. ${it.min} uni</small>` : '';
      if (it.price == null) { subEl.innerHTML = '<small>A confirmar</small>' + hint; hasConsultar = true; }
      else { const sub = it.price * it.qty; total += sub; subEl.innerHTML = formatCLP(sub) + hint; }
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

    // Enable submit only with items, quantities meeting each minimum, a valid
    // future date (if torta) and a real name.
    const blocked = validItems === 0 || belowMin || dateBlocksTorta || !isValidName(nameInput.value);
    submitBtn.disabled = blocked;
    submitBtn.classList.toggle('is-disabled', blocked);
    form.dataset.torta = hasTorta ? '1' : '0';
  }

  // Name validation: live button state on input; red message on blur.
  nameInput.addEventListener('input', update);
  nameInput.addEventListener('blur', () => {
    const bad = !!nameInput.value.trim() && !isValidName(nameInput.value);
    nameError.classList.toggle('field-hidden', !bad);
    nameInput.classList.toggle('input-error', bad);
    update();
  });

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

  // Enforce per-product minimum quantities.
  const under = cart.find(it => it.qty < minQtyFor(it.name));
  if (under) {
    alert(`"${under.name}" tiene un mínimo de ${minQtyFor(under.name)} unidades. Ajusta la cantidad.`);
    return null;
  }

  const nameEl = form.querySelector('[name="nombre"]');
  const nombre = (nameEl.value || '').trim().replace(/\s+/g, ' ');
  const fecha = form.querySelector('[name="fecha"]').value;
  const nota = (form.querySelector('[name="nota"]').value || '').trim();
  const entregaEl = form.querySelector('input[name="entrega"]:checked');

  if (!isValidName(nombre)) {
    const err = form.querySelector('[data-name-error]');
    if (err) err.classList.remove('field-hidden');
    nameEl.classList.add('input-error');
    nameEl.focus();
    return null;
  }
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
