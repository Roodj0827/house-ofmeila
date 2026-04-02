// ─── DONNÉES ───
// Les données sont lues depuis /data/products.json et /data/settings.json
// Ces fichiers sont gérés par Decap CMS et versionnés sur GitHub.
let data = { products: [], settings: {} };

const CAT_LABELS = {
  jeu_de_bijoux: 'Jeu de bijoux',
  collier: 'Collier',
  bracelet: 'Bracelet',
  bague: 'Bague',
  chevillere: 'Chevillère',
  tour_de_cou: 'Tour de cou',
  montre: 'Montre',
  valise: 'Valise',
  lunettes: 'Lunettes',
  boucles: "Boucles d'oreilles",
  autres: 'Autres'
};
const CAT_ICONS = {
  jeu_de_bijoux: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`,
  collier: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>`,
  bracelet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8"/></svg>`,
  bague: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="5"/></svg>`,
  montre: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="7"/><polyline points="12 9 12 12 13.5 13.5"/><path d="M16.51 17.35l-.35 3.83a2 2 0 01-2 1.82H9.83a2 2 0 01-2-1.82l-.35-3.83m.01-10.7l.35-3.83A2 2 0 019.83 1h4.35a2 2 0 012 1.82l.35 3.83"/></svg>`,
  boucles: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="12" r="4"/><circle cx="16" cy="12" r="4"/></svg>`,
  default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`
};

// ─── CONVERTISSEUR D URLs EN LIENS D IMAGE DIRECTE ───
function convertImageUrl(url) {
  if (!url) return '';

  // Google Drive
  const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  const driveOpenMatch = url.match(/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([a-zA-Z0-9_-]+)/);
  const driveId = (driveFileMatch && driveFileMatch[1]) || (driveOpenMatch && driveOpenMatch[1]);
  if (driveId) {
    return 'https://drive.google.com/uc?export=view&id=' + driveId;
  }

  // Google Photos / lh3.googleusercontent.com
  if (url.includes('photos.google.com') || url.includes('lh3.googleusercontent.com')) {
    const clean = url.replace(/=[wsh]\d+(-[wsh]\d+)*$/, '');
    return clean + '=w1200';
  }

  return url;
}

// ─── LOAD DATA depuis les fichiers JSON ───
async function loadData() {
  try {
    const [productsRes, settingsRes] = await Promise.all([
      fetch('/data/products.json'),
      fetch('/data/settings.json')
    ]);

    if (productsRes.ok) {
      const raw = await productsRes.json();
      // Decap CMS stocke les produits sous { items: [...] } avec le widget list
      // On accepte aussi un tableau direct pour la compatibilité
      const list = Array.isArray(raw) ? raw : (raw.items || []);
      data.products = list.map((p, i) => ({
        id: p.id || (i + 1),
        ...p,
        image: convertImageUrl(p.image)
      }));
    }

    if (settingsRes.ok) {
      const s = await settingsRes.json();
      data.settings = { ...s, logoUrl: convertImageUrl(s.logoUrl) };
    }

  } catch (e) {
    console.warn('Erreur chargement données:', e);
  }
}

// ─── WHATSAPP ───
function buildWaUrl(msg) {
  const num = (data.settings.whatsapp || '').replace(/\D/g, '');
  if (!num) return '#';
  const text = encodeURIComponent(msg || data.settings.message || 'Bonjour, je voudrais des informations sur vos produits.');
  return `https://wa.me/${num}?text=${text}`;
}

function openWhatsApp(msg) {
  const url = buildWaUrl(msg);
  if (url === '#') { alert("Numéro WhatsApp non configuré."); return; }
  window.open(url, '_blank');
}

function buildProductWaMsg(p) {
  const lines = [];
  lines.push(`Bonjour *House of Meila* ! 👋`);
  lines.push(``);
  lines.push(`Je suis intéressée par ce produit :`);
  lines.push(``);
  lines.push(`🏷️ *${p.name}*`);
  if (p.category) lines.push(`📂 Catégorie : ${getCatLabel(p.category)}`);
  lines.push(`💰 Prix : *${formatPrice(p.price)} HTG*`);
  if (p.desc) lines.push(`📝 ${p.desc}`);
  if (p.image && p.image.startsWith('http')) {
    lines.push(``);
    lines.push(`🖼️ Photo du produit :`);
    lines.push(p.image);
  }
  lines.push(``);
  lines.push(`Pouvez-vous me donner plus d'informations ? Merci ! 🙏`);
  return lines.join('\n');
}

// ─── LOGO ───
function applyLogo() {
  const src = data.settings.logoUrl;
  if (!src) return;

  const nm = document.getElementById('nav-logo-mark');
  nm.innerHTML = `<img src="${src}" alt="Logo">`;

  const ap = document.getElementById('about-logo-placeholder');
  if (ap) ap.innerHTML = `<img src="${src}" alt="Logo" style="width:100%;height:100%;object-fit:contain;padding:20px">`;

  const fl = document.getElementById('footer-logo-mark');
  if (fl) fl.innerHTML = `<img src="${src}" alt="Logo" style="width:100%;height:100%;object-fit:contain">`;
}

// ─── SETTINGS ───
function applySettings() {
  const s = data.settings;

  // Barre d'annonce
  if (s.announcement) {
    const bar = document.getElementById('announcement-bar');
    const txt = document.getElementById('announcement-text');
    txt.innerHTML = s.announcement;
    bar.style.display = 'block';
  }

  // Boutons WhatsApp
  const waUrl = buildWaUrl();
  const mobWaBtn = document.getElementById('mob-wa-btn');
  if (mobWaBtn) mobWaBtn.href = waUrl !== '#' ? waUrl : '#';
  document.getElementById('wa-float').href = waUrl !== '#' ? waUrl : '#';
  document.getElementById('empty-wa-btn').onclick = () => openWhatsApp();

  const fwa = document.getElementById('footer-wa-link');
  fwa.onclick = () => openWhatsApp();
  fwa.style.cursor = 'pointer';

  // Icônes réseaux sociaux footer
  const social = document.getElementById('footer-social');
  const socialLinks = [];
  if (s.instagram) socialLinks.push({ url: s.instagram, icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`, label: 'Instagram' });
  if (s.facebook) socialLinks.push({ url: s.facebook, icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>`, label: 'Facebook' });
  if (s.tiktok) socialLinks.push({ url: s.tiktok, icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 12a4 4 0 104 4V4a5 5 0 005 5"/></svg>`, label: 'TikTok' });
  social.innerHTML = socialLinks.map(l => `<a class="social-link" href="${l.url}" target="_blank" title="${l.label}">${l.icon}</a>`).join('');

  // Liens texte footer
  const fig = document.getElementById('footer-ig-link');
  if (s.instagram) { fig.style.display = 'block'; fig.onclick = () => window.open(s.instagram, '_blank'); }
  else fig.style.display = 'none';

  const ffb = document.getElementById('footer-fb-link');
  if (s.facebook) { ffb.style.display = 'block'; ffb.onclick = () => window.open(s.facebook, '_blank'); }
  else ffb.style.display = 'none';

  const ftt = document.getElementById('footer-tt-link');
  if (s.tiktok) { ftt.style.display = 'block'; ftt.onclick = () => window.open(s.tiktok, '_blank'); }
  else ftt.style.display = 'none';
}

// ─── FORMAT ───
function formatPrice(p) {
  return Number(p).toLocaleString('fr-FR');
}
function getCatLabel(c) {
  return CAT_LABELS[c] || c.replace(/_/g, ' ');
}
function getCatIcon(c) {
  return CAT_ICONS[c] || CAT_ICONS.default;
}

// ─── HERO IMAGE ───
function setHeroImage() {
  const prods = data.products.filter(p => p.image);
  if (prods.length > 0) {
    const src = prods[0].image;
    const c = document.getElementById('hero-img-container');
    c.innerHTML = `<img src="${src}" alt="${prods[0].name}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentNode.innerHTML='<div class=hero-img-placeholder><svg viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'1\\'><path d=\\'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z\\'/></svg><p>Bijoux House of Meila</p></div>'">`;
  }
}

// ─── STATS ───
function updateStats() {
  const prods = data.products;
  const cats = [...new Set(prods.map(p => p.category).filter(Boolean))];
  document.getElementById('stat-products').textContent = prods.length || '—';
  document.getElementById('stat-categories').textContent = cats.length || '—';
}

// ─── FILTERS ───
let activeFilter = 'all';
function renderFilters() {
  const cats = [...new Set(data.products.map(p => p.category).filter(Boolean))];
  const bar = document.getElementById('filter-bar');
  if (cats.length === 0) { bar.style.display = 'none'; return; }

  let html = `<button class="filter-btn active" onclick="applyFilter('all',this)">Tout voir</button>`;
  cats.forEach(c => {
    html += `<button class="filter-btn" onclick="applyFilter('${c}',this)">${getCatLabel(c)}</button>`;
  });
  bar.innerHTML = html;
}

function applyFilter(cat, btn) {
  activeFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderCatalogue();
}

// ─── CATALOGUE ───
function renderCatalogue() {
  const content = document.getElementById('catalogue-content');
  const noMsg = document.getElementById('no-products-msg');

  let products = data.products;
  if (activeFilter !== 'all') products = products.filter(p => p.category === activeFilter);

  if (data.products.length === 0) {
    content.innerHTML = '';
    noMsg.style.display = 'block';
    return;
  }
  noMsg.style.display = 'none';

  let categorized = {};
  if (activeFilter === 'all') {
    products.forEach(p => {
      const c = p.category || 'autres';
      if (!categorized[c]) categorized[c] = [];
      categorized[c].push(p);
    });
  } else {
    categorized[activeFilter] = products;
  }

  let html = '';
  Object.entries(categorized).forEach(([cat, items]) => {
    html += `
    <div class="category-section">
      <div class="category-title-row">
        <div class="cat-icon">${getCatIcon(cat)}</div>
        <h3 class="cat-name">${getCatLabel(cat)}</h3>
        <span class="cat-count">${items.length} article${items.length > 1 ? 's' : ''}</span>
      </div>
      <div class="products-grid">
        ${items.map(p => productCard(p)).join('')}
      </div>
    </div>`;
  });

  content.innerHTML = html;
}

function productCard(p) {
  const img = p.image;
  const imgHtml = img
    ? `<img src="${img}" alt="${p.name}" loading="lazy" onerror="this.parentNode.innerHTML='<div class=product-card-img-placeholder><svg viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'1.5\\'><path d=\\'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z\\'/></svg><span>Bijou</span></div>'">`
    : `<div class="product-card-img-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><span>Bijou</span></div>`;

  const msg = buildProductWaMsg(p);
  const waUrl = buildWaUrl(msg);

  return `
  <div class="product-card" onclick="openModal('${p.id}')">
    <div class="product-card-img">
      ${imgHtml}
      <div class="product-card-badge">Voir détails</div>
    </div>
    <div class="product-card-body">
      <div class="product-card-cat">${getCatLabel(p.category || '')}</div>
      <h3 class="product-card-name">${p.name}</h3>
      ${p.desc ? `<p class="product-card-desc">${p.desc}</p>` : ''}
      <div class="product-card-footer">
        <div class="product-card-price">${formatPrice(p.price)} <span>HTG</span></div>
        <a class="btn-whatsapp" href="${waUrl}" target="_blank" onclick="event.stopPropagation()">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/></svg>
          Info / Commande
        </a>
      </div>
    </div>
  </div>`;
}

// ─── MODAL ───
function openModal(id) {
  const p = data.products.find(x => String(x.id) === String(id));
  if (!p) return;
  const img = p.image;
  const msg = buildProductWaMsg(p);
  const waUrl = buildWaUrl(msg);

  const imgHtml = img
    ? `<img src="${img}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentNode.innerHTML='<div class=modal-img-placeholder><svg viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'1\\'><path d=\\'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z\\'/></svg></div>'">`
    : `<div class="modal-img-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>`;

  document.getElementById('modal-box').innerHTML = `
    <div class="modal-img">${imgHtml}</div>
    <div class="modal-body">
      <div class="modal-cat">${getCatLabel(p.category || '')}</div>
      <h2 class="modal-name">${p.name}</h2>
      <div class="modal-price">${formatPrice(p.price)} <span>HTG</span></div>
      ${p.desc ? `<p class="modal-desc">${p.desc}</p>` : ''}
      <a class="btn-wa-modal" href="${waUrl}" target="_blank">
        <svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/></svg>
        Demander des infos & Commander
      </a>
      <p style="font-size:11px;color:var(--mist);margin-top:12px;text-align:center;font-weight:300">Un de nos conseillers vous répondra rapidement sur WhatsApp</p>
    </div>`;

  document.getElementById('modal-bg').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(e) {
  if (e.target === document.getElementById('modal-bg')) closeModalDirect();
}
function closeModalDirect() {
  document.getElementById('modal-bg').classList.remove('open');
  document.body.style.overflow = '';
}

// ─── SOCIAL SECTION ───
function renderSocialSection() {
  const s = data.settings;
  const items = [];

  if (s.instagram) items.push({ url: s.instagram, label: 'Instagram', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="2" width="20" height="20" rx="5.5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke-linecap="round" stroke-width="2"/></svg>` });
  if (s.facebook) items.push({ url: s.facebook, label: 'Facebook', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>` });
  if (s.tiktok) items.push({ url: s.tiktok, label: 'TikTok', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 12a4 4 0 104 4V4a5 5 0 005 5"/></svg>` });
  const waUrl = buildWaUrl('Bonjour House of Meila ! Je souhaite en savoir plus sur vos produits. 😊');
  if (s.whatsapp) items.push({ url: waUrl, label: 'WhatsApp', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a5.36 5.36 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/><path d="M20.885 3.488A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892a11.84 11.84 0 001.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.058-8.413z"/></svg>` });

  const grid = document.getElementById('social-section-grid');
  const section = document.getElementById('social-section');

  if (items.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';

  grid.innerHTML = items.map(item => `
    <a class="social-circle-item" href="${item.url}" target="_blank" rel="noopener">
      <div class="social-circle">${item.icon}</div>
      <span class="social-circle-label">${item.label}</span>
    </a>
  `).join('');
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const navH = document.getElementById('main-nav') ? document.getElementById('main-nav').offsetHeight : 74;
  const top = el.getBoundingClientRect().top + window.scrollY - navH;
  window.scrollTo({ top, behavior: 'smooth' });
}

// ─── NAV SCROLL ───
window.addEventListener('scroll', () => {
  const nav = document.getElementById('main-nav');
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

// ─── MOB MENU ───
function openMobMenu() {
  document.getElementById('mob-drawer').classList.add('open');
  document.getElementById('mob-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeMobMenu() {
  document.getElementById('mob-drawer').classList.remove('open');
  document.getElementById('mob-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ─── INIT (async) ───
async function init() {
  await loadData();
  applyLogo();
  applySettings();
  setHeroImage();
  updateStats();
  renderFilters();
  renderCatalogue();
  renderSocialSection();
}

init();

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModalDirect(); });
