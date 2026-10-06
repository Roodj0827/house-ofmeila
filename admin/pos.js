/* =========================================================
   HOUSE OF MEILA — POS
   ========================================================= */
const SUPABASE_URL = 'https://zpwxoooqnxvxoahltjkh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_amt16PERz3_dyckZWf3oUA_2SzshhGy';
const ADMIN_PASSWORD = 'house of meila'; // ⚠ vérifié côté navigateur seulement (voir notes)
const SELLERS = ['Meila', 'Samantha', 'Mme Edeline', 'Rood-Jerry'];
const WHATSAPP_TAB_NAME = 'whatsapp_web_tab';
const STATUS_LABELS = { PAID: 'Acquittée', PARTIAL: 'Partiellement Acquittée', UNPAID: 'Non Acquittée' };
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const supabaseClientFactory = window.supabase && typeof window.supabase.createClient === 'function'
  ? window.supabase.createClient
  : null;
const supabaseClient = supabaseClientFactory ? supabaseClientFactory(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const state = {
  products: [],
  settings: {},
  customers: [],
  sales: [],
  selectedCustomer: null,
  cart: [],
  selectedCategory: 'all',
  amountPaidTouched: false,
  customerFormMode: 'create',
  editingCustomerId: null,
  lastSale: null,
  paymentTarget: null,
  editDraft: null,
  reportRows: [],
  view: 'caisse'
};

const $ = (id) => document.getElementById(id);
const els = {
  // navigation
  navButtons: document.querySelectorAll('[data-nav]'),
  operatorSelect: $('operator-select'),
  resetSale: $('reset-sale'),
  // client
  clientSearch: $('client-search'),
  searchClient: $('search-client'),
  clientResult: $('client-result'),
  customerCreationBox: $('customer-creation-box'),
  customerFormTitle: $('customer-form-title'),
  customerNameLabel: $('customer-name-label'),
  clientForm: $('client-form'),
  customerName: $('customer-name'),
  customerPhone: $('customer-phone'),
  fullCustomerFields: $('full-customer-fields'),
  customerFirstname: $('customer-firstname'),
  customerLastname: $('customer-lastname'),
  customerCard: $('customer-card'),
  customerStamps: $('customer-stamps'),
  customerSubmit: $('customer-submit'),
  cancelCustomerEdit: $('cancel-customer-edit'),
  // produits
  productSearch: $('product-search'),
  productResults: $('product-results'),
  categoryFilters: $('category-filters'),
  quickAddProduct: $('quick-add-product'),
  quickAddModal: $('quick-add-modal'),
  quickAddForm: $('quick-add-form'),
  quickName: $('quick-name'),
  quickPrice: $('quick-price'),
  closeModal: $('close-modal'),
  // panier / paiement
  cartItems: $('cart-items'),
  subtotalAmount: $('subtotal-amount'),
  discountAmount: $('discount-amount'),
  totalAmount: $('total-amount'),
  sellerSelect: $('seller-select'),
  paymentMode: $('payment-mode'),
  amountPaid: $('amount-paid'),
  fillFullAmount: $('fill-full-amount'),
  balanceAmount: $('balance-amount'),
  paymentStatusBadge: $('payment-status-badge'),
  paymentHint: $('payment-hint'),
  dueDateWrap: $('due-date-wrap'),
  dueDate: $('due-date'),
  autoWhatsapp: $('auto-whatsapp'),
  confirmSale: $('confirm-sale'),
  loyaltyStatus: $('loyalty-status'),
  loyaltyMessage: $('loyalty-message'),
  // créances
  creanceSearch: $('creance-search'),
  creanceStatus: $('creance-status'),
  creanceKpiTotal: $('creance-kpi-total'),
  creanceKpiCount: $('creance-kpi-count'),
  creanceKpiOverdue: $('creance-kpi-overdue'),
  creancesRows: $('creances-rows'),
  // rapports
  reportRange: $('report-range'),
  reportMonth: $('report-month'),
  reportMonthWrap: $('report-month-wrap'),
  reportYear: $('report-year'),
  reportYearWrap: $('report-year-wrap'),
  reportCustomerSearch: $('report-customer-search'),
  downloadReport: $('download-report'),
  kpiRevenue: $('kpi-revenue'),
  kpiGlobal: $('kpi-global'),
  kpiSalesCount: $('kpi-sales-count'),
  kpiAverageTicket: $('kpi-average-ticket'),
  kpiDiscountTotal: $('kpi-discount-total'),
  kpiCash: $('kpi-cash'),
  kpiMoncash: $('kpi-moncash'),
  kpiNatcash: $('kpi-natcash'),
  kpiOther: $('kpi-other'),
  reportRows: $('report-rows'),
  openCustomerGroupPage: $('open-customer-group-page'),
  // modales
  confirmModal: $('confirm-modal'),
  confirmBody: $('confirm-body'),
  confirmSendWa: $('confirm-send-wa'),
  confirmPrint: $('confirm-print'),
  confirmClose: $('confirm-close'),
  paymentModal: $('payment-modal'),
  paymentForm: $('payment-form'),
  paymentInfo: $('payment-info'),
  paymentAmount: $('payment-amount'),
  paymentModeInput: $('payment-mode-input'),
  paymentNote: $('payment-note'),
  editSaleModal: $('edit-sale-modal'),
  editSaleTitle: $('edit-sale-title'),
  editCustomerSearch: $('edit-customer-search'),
  editCustomerFind: $('edit-customer-find'),
  editCustomerLabel: $('edit-customer-label'),
  editSeller: $('edit-seller'),
  editDiscount: $('edit-discount'),
  editEcheance: $('edit-echeance'),
  editItems: $('edit-items'),
  editAddProduct: $('edit-add-product'),
  editAddItem: $('edit-add-item'),
  editAddExpress: $('edit-add-express'),
  editSubtotal: $('edit-subtotal'),
  editTotal: $('edit-total'),
  editPaid: $('edit-paid'),
  editBalance: $('edit-balance'),
  editStatus: $('edit-status'),
  editSave: $('edit-save'),
  historyModal: $('history-modal'),
  historyTitle: $('history-title'),
  historyBody: $('history-body')
};

/* =========================================================
   UTILITAIRES
   ========================================================= */
function normalizeWhitespace(value) { return String(value || '').trim(); }
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function round(n) { return Math.round((Number(n) || 0) * 100) / 100; }
function formatCurrency(value) { return `${Number(value || 0).toLocaleString('fr-FR')} HTG`; }
function formatPrice(value) { return formatCurrency(value); }
function formatDateTime(v) {
  const d = new Date(v);
  return isNaN(d) ? '—' : d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}
// Les dates "YYYY-MM-DD" (échéance) sont lues sans passer par Date() pour éviter
// le décalage de fuseau horaire (UTC → Haïti).
function formatDateOnly(v) {
  if (!v) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v));
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(v);
  return isNaN(d) ? '—' : d.toLocaleDateString('fr-FR');
}
function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function getJsonPath(path) {
  return window.location.pathname.includes('/admin/') ? `../${path}` : `/${path}`;
}

/** Calcule balance + statut. Le montant payé n'est PAS plafonné ici (cas d'une fiche
 *  rabaissée après paiement) ; la caisse plafonne elle-même avant d'appeler. */
function computePayment(total, paid) {
  const t = round(total);
  const p = Math.max(0, round(paid));
  const balance = Math.max(0, round(t - p));
  let status = 'PARTIAL';
  if (balance <= 0) status = 'PAID';
  else if (p <= 0) status = 'UNPAID';
  return { total: t, paid: p, balance, status };
}
function badgeHtml(status) {
  const key = String(status || 'PAID').toLowerCase();
  return `<span class="pay-badge ${key}" title="${esc(STATUS_LABELS[status] || '')}">${esc(status)}</span>`;
}
function setBadge(el, status) {
  el.className = `pay-badge ${String(status).toLowerCase()}`;
  el.textContent = status;
  el.title = STATUS_LABELS[status] || '';
}
function showModal(modal) { modal.classList.remove('hidden'); }
function hideModal(modal) { modal.classList.add('hidden'); }

/* ---- Opérateur & audit ---- */
function getOperator() {
  const op = normalizeWhitespace(els.operatorSelect.value);
  if (!op) {
    alert('Sélectionnez l\'opérateur (en haut à droite) : son nom est enregistré dans le journal d\'audit.');
    els.operatorSelect.focus();
    return null;
  }
  return op;
}
function makeAudit(author, action, details) {
  return { date: new Date().toISOString(), auteur: author, action, details: details || '' };
}
function requireAdmin(label) {
  const pwd = window.prompt(`Mot de passe administrateur requis pour ${label} :`);
  if (pwd === null) return false;
  if (normalizeWhitespace(pwd).toLowerCase() !== ADMIN_PASSWORD) {
    alert('Mot de passe incorrect. Action annulée.');
    return false;
  }
  return window.confirm(`Confirmer : ${label} ?\nCette action est irréversible.`);
}

/* =========================================================
   MAPPING & ACCÈS DONNÉES (Supabase)
   ========================================================= */
function mapCustomerRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name || '',
    firstname: row.firstname || row.name || '',
    lastname: row.lastname || '',
    phone: row.phone || '',
    cardNumber: row.card_number || row.cardNumber || 'HM-0000',
    nb_achats: Number(row.nb_achats || 0),
    lastSaleAt: row.last_sale_at || row.lastSaleAt || null
  };
}

function mapSaleRow(row) {
  if (!row) return null;
  const timestamp = row.timestamp || row.created_at || new Date().toISOString();
  const paymentMode = row.payment_mode || row.paymentMode || 'Cash';
  const total = Number(row.total_facture ?? row.total ?? 0);
  // Anciennes ventes (avant migration) : considérées comme intégralement payées.
  const hasPayment = row.montant_paye !== null && row.montant_paye !== undefined;
  const pay = computePayment(total, hasPayment ? Number(row.montant_paye) : total);
  let history = Array.isArray(row.historique_paiements) ? row.historique_paiements : [];
  if (!hasPayment && !history.length && total > 0) {
    history = [{ date: timestamp, montant: total, mode_paiement: paymentMode, note: 'Paiement à la vente' }];
  }
  return {
    id: row.id,
    receiptNumber: Number(row.receipt_number || row.receiptNumber || 0),
    timestamp,
    customerId: row.customer_id || row.customerId || null,
    customerName: row.customer_name || row.customerName || 'Client',
    cardNumber: row.card_number || row.cardNumber || 'HM-0000',
    seller: row.seller || 'Vendeur non défini',
    paymentMode,
    total: pay.total,
    totalFacture: pay.total,
    montantPaye: pay.paid,
    balanceRestante: pay.balance,
    statutPaiement: pay.status,
    echeance: row.echeance || null,
    historique: history,
    auditLog: Array.isArray(row.audit_log) ? row.audit_log : [],
    originalTotal: Number(row.original_total || row.originalTotal || 0),
    discount: Number(row.discount || 0),
    items: Array.isArray(row.items) ? row.items : [],
    loyaltyLevel: Number(row.loyalty_level || row.loyaltyLevel || 0),
    loyaltyBenefit: row.loyalty_benefit || row.loyaltyBenefit || 'Aucun avantage',
    customer: row.customer || {},
    discountRate: Number(row.discount_rate || row.discountRate || 0)
  };
}

/** Champs "paiement + audit" d'une fiche, au format colonnes SQL. */
function salePaymentToDb(s) {
  return {
    total: s.total,
    total_facture: s.total,
    montant_paye: s.montantPaye,
    balance_restante: s.balanceRestante,
    statut_paiement: s.statutPaiement,
    echeance: s.echeance || null,
    historique_paiements: s.historique,
    audit_log: s.auditLog
  };
}

function reportDbError(error, fallbackMessage) {
  console.error(error);
  const msg = String(error?.message || '');
  if (/column|schema cache/i.test(msg)) {
    alert('La base n\'a pas encore les colonnes de paiement.\nExécutez le script migration-creances.sql dans Supabase (SQL Editor).');
  } else {
    alert(fallbackMessage);
  }
}

async function loadSettings() {
  try {
    const response = await fetch(getJsonPath('data/settings.json'));
    if (response.ok) state.settings = await response.json();
  } catch (e) { console.warn('settings.json indisponible', e); }
}

async function readCustomers() {
  if (!supabaseClient) return [];
  const { data, error } = await supabaseClient.from('customers').select('*').order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return (data || []).map(mapCustomerRow).filter(Boolean);
}

async function readSales() {
  if (!supabaseClient) return [];
  const { data, error } = await supabaseClient.from('sales').select('*').order('timestamp', { ascending: false });
  if (error) { console.error(error); return []; }
  return (data || []).map(mapSaleRow).filter(Boolean);
}

async function fetchSaleById(id) {
  if (!supabaseClient) return null;
  const { data, error } = await supabaseClient.from('sales').select('*').eq('id', id).single();
  if (error) { console.error(error); return null; }
  return mapSaleRow(data);
}

async function refreshSales() { state.sales = await readSales(); }
async function refreshCustomers() { state.customers = await readCustomers(); }

async function createCustomerRecord(payload) {
  if (!supabaseClient) { alert('Supabase n\'est pas chargé. Vérifie le script CDN.'); return null; }
  const { data, error } = await supabaseClient.from('customers').insert([{
    name: payload.name,
    firstname: payload.firstname || payload.name,
    lastname: payload.lastname || '',
    phone: payload.phone,
    card_number: payload.cardNumber,
    nb_achats: Number(payload.nb_achats || 0),
    last_sale_at: payload.lastSaleAt || null
  }]).select();
  if (error) { console.error(error); alert('Impossible d\'enregistrer ce client dans Supabase.'); return null; }
  return mapCustomerRow(data?.[0] || null);
}

async function updateCustomerRecord(id, updates) {
  if (!supabaseClient || !id) return null;
  const { data, error } = await supabaseClient.from('customers').update(updates).eq('id', id).select();
  if (error) { console.error(error); return null; }
  return mapCustomerRow(data?.[0] || null);
}

async function deleteCustomerRecord(id) {
  if (!supabaseClient || !id) return false;
  const { error } = await supabaseClient.from('customers').delete().eq('id', id);
  if (error) { console.error(error); alert('Impossible de supprimer ce client.'); return false; }
  return true;
}

async function createSaleRecord(payload) {
  if (!supabaseClient) { alert('Supabase n\'est pas chargé.'); return null; }
  const { data, error } = await supabaseClient.from('sales').insert([{
    receipt_number: payload.receiptNumber,
    timestamp: payload.timestamp,
    customer_id: payload.customerId,
    customer_name: payload.customerName,
    card_number: payload.cardNumber,
    seller: payload.seller,
    payment_mode: payload.paymentMode,
    original_total: Number(payload.originalTotal || 0),
    discount: Number(payload.discount || 0),
    items: payload.items,
    loyalty_level: Number(payload.loyaltyLevel || 0),
    loyalty_benefit: payload.loyaltyBenefit,
    customer: payload.customer,
    discount_rate: Number(payload.discountRate || 0),
    ...salePaymentToDb(payload)
  }]).select();
  if (error) { reportDbError(error, 'Impossible d\'enregistrer la vente dans Supabase.'); return null; }
  return mapSaleRow(data?.[0] || null);
}

async function updateSaleRecord(id, updates) {
  if (!supabaseClient || !id) return null;
  const { data, error } = await supabaseClient.from('sales').update(updates).eq('id', id).select();
  if (error) { reportDbError(error, 'Impossible de mettre à jour la fiche.'); return null; }
  return mapSaleRow(data?.[0] || null);
}

function replaceSaleInState(sale) {
  if (!sale) return;
  const i = state.sales.findIndex((s) => String(s.id) === String(sale.id));
  if (i >= 0) state.sales[i] = sale; else state.sales.unshift(sale);
}

async function getReceiptNumber() {
  if (!supabaseClient) return 1;
  // MAX(receipt_number)+1 plutôt que count+1 : reste unique même après une suppression.
  const { data, error } = await supabaseClient
    .from('sales').select('receipt_number').order('receipt_number', { ascending: false }).limit(1);
  if (error) { console.error(error); return 1; }
  return Number(data?.[0]?.receipt_number || 0) + 1;
}

async function adjustCustomerStampCount(customerId, delta) {
  if (!customerId || !supabaseClient) return;
  const { data, error } = await supabaseClient.from('customers').select('id, nb_achats').eq('id', customerId).single();
  if (error || !data) { console.error(error); return; }
  const next = Math.min(10, Math.max(0, Number(data.nb_achats || 0) + Number(delta || 0)));
  await supabaseClient.from('customers').update({ nb_achats: next }).eq('id', customerId);
}

/* =========================================================
   NAVIGATION (vues Caisse / Créances / Rapports)
   ========================================================= */
async function showView(name) {
  state.view = name;
  ['caisse', 'creances', 'rapports'].forEach((v) => $(`view-${v}`).classList.toggle('hidden', v !== name));
  els.navButtons.forEach((b) => b.classList.toggle('active', b.dataset.nav === name));
  if (name === 'creances') { await refreshSales(); renderCreancesTable(); }
  if (name === 'rapports') { await refreshSales(); populateReportFilters(); renderReportDashboard({ refresh: false }); }
}

/* =========================================================
   CATALOGUE & PANIER
   ========================================================= */
async function loadProducts() {
  try {
    const response = await fetch(getJsonPath('data/products.json'));
    if (!response.ok) return;
    const payload = await response.json();
    const items = Array.isArray(payload) ? payload : payload.items || [];
    state.products = items.map((item, index) => ({
      id: item.id || `prod-${index + 1}`,
      name: item.name || 'Produit sans nom',
      price: Number(item.price || 0),
      category: item.category || 'autres',
      desc: item.desc || '',
      image: item.image || '',
      isSoldOut: Boolean(item.isSoldOut)
    }));
  } catch (e) { console.warn('products.json indisponible', e); }
  renderCategoryFilters();
  renderProducts();
}

function renderCategoryFilters() {
  const categories = Array.from(new Set(state.products.map((p) => p.category || 'autres'))).sort((a, b) => a.localeCompare(b, 'fr'));
  const chips = [{ key: 'all', label: 'Tous' }, ...categories.map((c) => ({ key: c, label: c }))];
  els.categoryFilters.innerHTML = chips.map((chip) => `
    <button type="button" class="category-chip${state.selectedCategory === chip.key ? ' active' : ''}" data-category="${esc(chip.key)}">${esc(chip.label)}</button>
  `).join('');
  els.categoryFilters.querySelectorAll('[data-category]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedCategory = button.dataset.category;
      renderCategoryFilters();
      renderProducts();
    });
  });
}

function renderProducts() {
  const query = normalizeWhitespace(els.productSearch.value).toLowerCase();
  const rows = state.products.filter((product) => {
    if (state.selectedCategory !== 'all' && (product.category || 'autres') !== state.selectedCategory) return false;
    if (!query) return true;
    return product.name.toLowerCase().includes(query) || (product.category || '').toLowerCase().includes(query);
  });

  if (!rows.length) { els.productResults.innerHTML = '<div class="muted">Aucun produit trouvé.</div>'; return; }

  els.productResults.innerHTML = rows.map((product) => `
    <div class="product-card">
      <img src="${esc(product.image || '../favicon.png')}" alt="${esc(product.name)}" />
      <div class="product-name">${esc(product.name)}</div>
      <div class="product-meta">
        <span>${esc(product.category)}</span>
        <strong>${formatPrice(product.price)}</strong>
      </div>
      <button type="button" class="mini-btn" data-product-id="${esc(product.id)}">Ajouter</button>
    </div>
  `).join('');

  els.productResults.querySelectorAll('[data-product-id]').forEach((button) => {
    button.addEventListener('click', () => addToCart(button.dataset.productId, button));
  });
}

function addToCart(productId, trigger) {
  const selected = state.products.find((p) => String(p.id) === String(productId));
  if (!selected) return;
  const existing = state.cart.find((item) => String(item.id) === String(productId));
  if (existing) existing.quantity += 1;
  else state.cart.push({ id: selected.id, name: selected.name, price: Number(selected.price || 0), quantity: 1, source: 'catalog' });

  if (trigger) {
    trigger.classList.add('added');
    trigger.textContent = 'Ajouté ✓';
    setTimeout(() => { trigger.classList.remove('added'); trigger.textContent = 'Ajouter'; }, 500);
  }
  renderCart();
}

function changeQuantity(productId, delta) {
  const item = state.cart.find((e) => String(e.id) === String(productId));
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) state.cart = state.cart.filter((e) => String(e.id) !== String(productId));
  renderCart();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter((e) => String(e.id) !== String(productId));
  renderCart();
}

function getCartTotal() {
  return state.cart.reduce((t, item) => t + Number(item.price || 0) * Number(item.quantity || 0), 0);
}

function getLoyaltyStatus(customer) {
  const level = Math.min(Number(customer?.nb_achats || 0), 10);
  if (level >= 10) return { label: 'Tampon 10/10', discount: 0.5, message: 'Avantage appliqué : 50% sur la vente.', benefit: '50% de réduction' };
  if (level >= 7) return { label: 'Tampon 7/10', discount: 0.3, message: 'Avantage appliqué : 30% de réduction.', benefit: '30% de réduction' };
  if (level >= 5) return { label: 'Tampon 5/10', discount: 0, message: 'Avantage appliqué : Cadeau 🎁.', benefit: 'Cadeau 🎁' };
  if (level >= 3) return { label: 'Tampon 3/10', discount: 0.1, message: 'Avantage appliqué : 10% de réduction.', benefit: '10% de réduction' };
  return { label: 'Aucun tampon', discount: 0, message: 'Aucun avantage fidélité pour cette carte.', benefit: 'Aucun avantage' };
}

function getDiscountedTotal() {
  const subtotal = getCartTotal();
  const status = getLoyaltyStatus(state.selectedCustomer);
  const discountAmount = round(subtotal * status.discount);
  return { subtotal, discountRate: status.discount, discountAmount, finalTotal: round(subtotal - discountAmount), benefit: status.benefit || 'Aucun avantage' };
}

function renderCart() {
  const pricing = getDiscountedTotal();

  if (!state.cart.length) {
    els.cartItems.innerHTML = '<tr><td colspan="5" class="muted" style="padding: 18px; text-align: center;">Le panier est vide.</td></tr>';
  } else {
    els.cartItems.innerHTML = state.cart.map((item) => `
      <tr>
        <td class="qty-cell">
          <div class="qty-adjust">
            <button type="button" class="qty-btn" data-qty-action="decrease" data-id="${esc(item.id)}">−</button>
            <span class="qty-value">${item.quantity}</span>
            <button type="button" class="qty-btn" data-qty-action="increase" data-id="${esc(item.id)}">+</button>
          </div>
        </td>
        <td>${esc(item.name)}</td>
        <td>${formatPrice(item.price)}</td>
        <td>${formatPrice(item.price * item.quantity)}</td>
        <td><button type="button" class="remove-btn" data-remove-id="${esc(item.id)}">Suppr.</button></td>
      </tr>
    `).join('');

    els.cartItems.querySelectorAll('[data-qty-action]').forEach((b) => b.addEventListener('click', () =>
      changeQuantity(b.dataset.id, b.dataset.qtyAction === 'increase' ? 1 : -1)));
    els.cartItems.querySelectorAll('[data-remove-id]').forEach((b) => b.addEventListener('click', () => removeFromCart(b.dataset.removeId)));
  }

  els.subtotalAmount.textContent = formatCurrency(pricing.subtotal);
  els.discountAmount.textContent = pricing.discountAmount > 0 ? `- ${formatCurrency(pricing.discountAmount)}` : '0 HTG';
  els.totalAmount.textContent = formatCurrency(pricing.finalTotal);
  updatePaymentSummary();
}

/** Acompte / balance / statut en temps réel (caisse). Retourne le calcul courant. */
function updatePaymentSummary() {
  const total = getDiscountedTotal().finalTotal;
  let paid;
  let capped = false;

  if (!state.amountPaidTouched) {
    paid = total;                                   // par défaut : payé en totalité
    els.amountPaid.value = total > 0 ? String(total) : '';
  } else {
    paid = Math.max(0, Number(els.amountPaid.value || 0));
    if (paid > total) { paid = total; capped = true; }
  }

  const pay = computePayment(total, paid);
  els.balanceAmount.textContent = formatCurrency(pay.balance);
  setBadge(els.paymentStatusBadge, pay.status);
  els.dueDateWrap.classList.toggle('hidden', pay.balance <= 0);
  if (pay.balance <= 0) els.dueDate.value = '';

  els.paymentHint.classList.toggle('hidden', !capped);
  if (capped) els.paymentHint.textContent = `Le montant versé dépasse le total : il sera ramené à ${formatCurrency(total)}.`;
  return pay;
}

/* =========================================================
   CLIENTS (recherche, carte, formulaire dynamique)
   ========================================================= */
async function searchCustomer(query) {
  if (!supabaseClient) return null;
  const clean = normalizeWhitespace(query).toLowerCase();

  if (!clean) {
    const { data, error } = await supabaseClient.from('customers').select('*').order('created_at', { ascending: false }).limit(1);
    if (error) { console.error(error); return null; }
    return mapCustomerRow(data?.[0] || null);
  }

  const digits = clean.replace(/\D/g, '');
  const escaped = clean.replace(/[%_,()]/g, '');
  const filters = [
    `card_number.ilike.%${escaped}%`, `firstname.ilike.%${escaped}%`,
    `lastname.ilike.%${escaped}%`, `name.ilike.%${escaped}%`
  ];
  if (digits) filters.push(`phone.ilike.%${digits}%`);

  const { data, error } = await supabaseClient.from('customers').select('*').or(filters.join(',')).limit(5);
  if (error) { console.error(error); return null; }
  return mapCustomerRow((data || [])[0] || null);
}

function toggleCustomerCreation(active) {
  els.customerCreationBox.style.display = active ? 'block' : 'none';
}

/** Mode 'create' = ajout rapide (nom + WhatsApp) ; mode 'edit' = édition complète. */
function setCustomerFormMode(mode, customer) {
  const edit = mode === 'edit' && customer;
  state.customerFormMode = edit ? 'edit' : 'create';
  state.editingCustomerId = edit ? customer.id : null;

  els.fullCustomerFields.classList.toggle('hidden', !edit);
  els.cancelCustomerEdit.classList.toggle('hidden', !edit);
  els.customerFormTitle.textContent = edit ? 'Modifier le client' : 'Nouveau client';
  els.customerNameLabel.textContent = edit ? 'Nom complet' : 'Nom';
  els.customerSubmit.textContent = edit ? 'Enregistrer les modifications' : 'Créer la carte fidélité';

  if (edit) {
    els.customerName.value = customer.name || '';
    els.customerPhone.value = customer.phone || '';
    els.customerFirstname.value = customer.firstname || '';
    els.customerLastname.value = customer.lastname || '';
    els.customerCard.value = customer.cardNumber || '';
    els.customerStamps.value = Number(customer.nb_achats || 0);
    toggleCustomerCreation(true);
  } else {
    els.clientForm.reset();
  }
}

function renderCustomerCard(customer) {
  if (!customer) {
    els.clientResult.className = 'client-card empty';
    els.clientResult.innerHTML = '<p class="muted">Aucun client sélectionné.</p>';
    els.loyaltyStatus.textContent = 'Aucune carte';
    els.loyaltyMessage.textContent = 'Aucune carte active.';
    state.selectedCustomer = null;
    setCustomerFormMode('create');
    toggleCustomerCreation(true);
    renderCart();
    return;
  }

  state.selectedCustomer = customer;
  els.clientResult.className = 'client-card';
  const clientName = customer.name || `${customer.firstname || ''} ${customer.lastname || ''}`.trim() || 'Client';

  els.clientResult.innerHTML = `
    <div class="client-card-head">
      <h3>${esc(clientName)}</h3>
      <span class="client-code">${esc(customer.cardNumber || 'HM-0000')}</span>
    </div>
    <div class="client-meta">
      <span>📞 ${esc(customer.phone || '—')}</span>
      <span>🧾 Tampons : ${Number(customer.nb_achats || 0)}/10</span>
    </div>
    <div class="client-card-actions">
      <button type="button" id="client-options-toggle" class="ghost-btn small" title="Options client">⋯</button>
      <button type="button" id="edit-customer-btn" class="secondary-btn hidden">Modifier</button>
      <button type="button" id="delete-customer-btn" class="remove-btn hidden">Supprimer ce client</button>
    </div>
  `;

  const status = getLoyaltyStatus(customer);
  els.loyaltyStatus.textContent = status.label;
  els.loyaltyMessage.textContent = status.message;

  $('client-options-toggle').addEventListener('click', () => {
    $('edit-customer-btn').classList.toggle('hidden');
    $('delete-customer-btn').classList.toggle('hidden');
  });
  $('edit-customer-btn').addEventListener('click', () => setCustomerFormMode('edit', state.selectedCustomer));
  $('delete-customer-btn').addEventListener('click', handleDeleteCustomerClick);

  // Un client est sélectionné : on masque le formulaire (sauf en cours d'édition).
  if (state.customerFormMode !== 'edit') toggleCustomerCreation(false);
  renderCart();
}

async function buildCustomerNumber() {
  const customers = await readCustomers();
  const used = customers
    .map((c) => Number((c.cardNumber || '').replace(/\D/g, '')))
    .filter((v) => Number.isFinite(v) && v > 0);
  return `HM-${(used.length ? Math.max(...used) : 1041) + 1}`;
}

async function handleCustomerFormSubmit(event) {
  event.preventDefault();
  if (state.customerFormMode === 'edit') return saveCustomerEdit();
  return createCustomerFromForm();
}

async function createCustomerFromForm() {
  const name = normalizeWhitespace(els.customerName.value);
  const phone = normalizeWhitespace(els.customerPhone.value.replace(/\s+/g, ''));
  if (!name || !phone) { alert('Veuillez remplir le nom et le WhatsApp du client.'); return; }

  const customers = await readCustomers();
  const duplicate = customers.find((c) => String(c.phone || '').replace(/\D/g, '') === phone.replace(/\D/g, ''));
  if (duplicate) {
    renderCustomerCard(duplicate);
    els.clientSearch.value = duplicate.cardNumber || duplicate.phone || '';
    return;
  }

  const created = await createCustomerRecord({
    name, firstname: name, lastname: '', phone,
    cardNumber: await buildCustomerNumber(), nb_achats: 0, lastSaleAt: null
  });
  if (!created) return;

  await refreshCustomers();
  els.clientForm.reset();
  renderCustomerCard(created);
  els.clientSearch.value = created.cardNumber;
}

async function saveCustomerEdit() {
  const id = state.editingCustomerId;
  const name = normalizeWhitespace(els.customerName.value);
  const phone = normalizeWhitespace(els.customerPhone.value.replace(/\s+/g, ''));
  if (!id || !name || !phone) { alert('Le nom et le WhatsApp sont obligatoires.'); return; }

  const stamps = Math.min(10, Math.max(0, Math.floor(Number(els.customerStamps.value || 0))));
  const updated = await updateCustomerRecord(id, {
    name,
    firstname: normalizeWhitespace(els.customerFirstname.value) || name,
    lastname: normalizeWhitespace(els.customerLastname.value),
    phone,
    nb_achats: stamps
  });
  if (!updated) { alert('Impossible de modifier ce client.'); return; }

  await refreshCustomers();
  setCustomerFormMode('create');
  renderCustomerCard(updated);
}

async function handleDeleteCustomerClick() {
  if (!state.selectedCustomer) return;
  if (!requireAdmin('supprimer ce client')) return;
  if (!(await deleteCustomerRecord(state.selectedCustomer.id))) return;
  await refreshCustomers();
  els.clientSearch.value = '';
  renderCustomerCard(null);
  alert('Client supprimé avec succès.');
}

/* =========================================================
   ARTICLE EXPRESS
   ========================================================= */
function openModal() { els.quickAddModal.classList.remove('hidden'); els.quickAddModal.style.display = 'flex'; }
function closeModal() { els.quickAddModal.classList.add('hidden'); els.quickAddModal.style.display = 'none'; }

// L'article express vit uniquement dans state.cart : jamais écrit dans le catalogue.
function addQuickProduct(event) {
  event.preventDefault();
  const name = normalizeWhitespace(els.quickName.value);
  const price = Number(els.quickPrice.value || 0);
  if (!name || !price || price <= 0) { alert('Indiquez le nom et le prix de l\'article express.'); return; }
  state.cart.push({ id: `express-${Date.now()}`, name, price, quantity: 1, source: 'quick', isTemporary: true, catalogId: null });
  els.quickAddForm.reset();
  closeModal();
  renderCart();
}

/* =========================================================
   REÇUS (WhatsApp & impression)
   ========================================================= */
function getPaymentModesLabel(sale) {
  const modes = [...new Set((sale.historique || []).map((p) => p.mode_paiement).filter(Boolean))];
  return modes.length ? modes.join(' + ') : 'Aucun versement';
}

function buildReceiptText(sale) {
  const lines = [];
  lines.push('HOUSE OF MEILA');
  lines.push('Petite place cazeau');
  lines.push('Village Roberce, rue la Paix #22');
  lines.push('3531-1567');
  lines.push('www.houseofmeila.com');
  lines.push('houseofmeila@gmail.com');
  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push("REÇU D'ACHAT");
  lines.push('');
  lines.push(`• Vendu à : ${sale.customerName}`);
  lines.push(`• Vendu par : ${sale.seller}`);
  lines.push(`• Date : ${new Date(sale.timestamp).toLocaleString('fr-FR')}`);
  lines.push(`• No. Reçu : #${sale.receiptNumber}`);
  lines.push(`• No. Carte Fidélité : ${sale.cardNumber}`);
  lines.push('');
  lines.push('------------------------------------');
  lines.push('');
  lines.push('QT. | DESCRIPTION | P.UNIT | MONTANT');
  lines.push('');
  lines.push('------------------------------------');
  lines.push('');
  sale.items.forEach((item) => {
    lines.push(`${item.quantity} | ${item.name} | ${formatPrice(item.price)} | ${formatPrice(item.price * item.quantity)}`);
  });
  lines.push('');
  lines.push('------------------------------------');
  lines.push('');
  if (sale.discount > 0) lines.push(`Réduction fidélité : - ${formatPrice(sale.discount)}`);
  lines.push(`TOTAL : ${formatPrice(sale.total)}`);
  lines.push(`Montant versé : ${formatPrice(sale.montantPaye)}`);
  lines.push(`Mode de paiement : ${getPaymentModesLabel(sale)}`);
  lines.push(`Balance restante : ${formatPrice(sale.balanceRestante)}`);
  lines.push(`Statut : ${sale.statutPaiement} (${STATUS_LABELS[sale.statutPaiement]})`);
  if (sale.balanceRestante > 0 && sale.echeance) lines.push(`Date d'échéance : ${formatDateOnly(sale.echeance)}`);
  if ((sale.historique || []).length > 1) {
    lines.push('');
    lines.push('VERSEMENTS');
    sale.historique.forEach((p) => lines.push(`• ${formatDateTime(p.date)} — ${formatPrice(p.montant)} (${p.mode_paiement || '—'})`));
  }
  lines.push('');
  lines.push('PROGRAMME FIDÉLITÉ');
  lines.push(`• Statut carte : Tampon ${sale.loyaltyLevel}/10`);
  if (sale.loyaltyBenefit) lines.push(`• Avantage appliqué : ${sale.loyaltyBenefit}`);
  lines.push('');
  lines.push('REJOIGNEZ-NOUS');
  lines.push(' Canal WhatsApp : https://whatsapp.com/channel/0029Vb9EqOx05MUXL89ZEL35');
  lines.push('Instagram : https://www.instagram.com/house_of_meila');
  lines.push('Facebook : https://www.facebook.com/share/18H8LCiXPC/');
  lines.push('TikTok : https://www.tiktok.com/@house.of.meila');
  lines.push('Abonnez-vous, likez, partagez et restez connecté avec nous !');
  lines.push('');
  lines.push('MERCI !');
  return lines.join('\n');
}

function buildReminderText(sale) {
  const lines = [
    `Bonjour ${sale.customerName},`,
    '',
    'Petit rappel de la part de House of Meila concernant votre fiche :',
    '',
    `• Fiche N° : #${sale.receiptNumber}`,
    `• Total : ${formatPrice(sale.total)}`,
    `• Montant versé : ${formatPrice(sale.montantPaye)}`,
    `• Balance due : ${formatPrice(sale.balanceRestante)}`
  ];
  if (sale.echeance) lines.push(`• Échéance convenue : ${formatDateOnly(sale.echeance)}`);
  lines.push('', 'Nous vous remercions de bien vouloir régulariser cette balance dès que possible (Cash, MonCash ou Natcash).', '', 'Merci pour votre confiance 💜', 'House of Meila');
  return lines.join('\n');
}

function formatClientPhoneForWhatsApp(phone) {
  const digits = normalizeWhitespace(String(phone || '')).replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('509') ? digits : `509${digits}`;
}

function isMobileDevice() {
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || navigator.vendor || '');
}

function getSalePhone(sale) {
  return sale.customer?.phone
    || state.customers.find((c) => String(c.id) === String(sale.customerId))?.phone
    || '';
}

/** Ouvre WhatsApp. PC : onglet nommé fixe → réutilisé à chaque envoi. Mobile : lien universel. */
function openWhatsApp(phone, text) {
  const target = formatClientPhoneForWhatsApp(phone);
  if (!target) { alert('Aucun numéro WhatsApp pour ce client.'); return; }
  const encoded = encodeURIComponent(text);

  if (isMobileDevice()) { window.location.href = `https://wa.me/${target}?text=${encoded}`; return; }

  // IMPORTANT : pas de "noopener" ici, sinon le navigateur ignore le nom de la cible
  // et ouvre un nouvel onglet à chaque fois.
  const tab = window.open(`https://web.whatsapp.com/send?phone=${target}&text=${encoded}`, WHATSAPP_TAB_NAME);
  if (!tab) { alert('Le navigateur a bloqué l\'ouverture de WhatsApp Web. Autorisez les pop-ups pour ce site.'); return; }
  try { tab.opener = null; tab.focus(); } catch (e) { /* ignoré */ }
}

function openWhatsAppReceipt(sale) {
  openWhatsApp(getSalePhone(sale) || state.settings.whatsapp || '', buildReceiptText(sale));
}

function sendReminder(sale) {
  openWhatsApp(getSalePhone(sale), buildReminderText(sale));
}

function printReceipt(sale) {
  const w = window.open('', 'receipt_print', 'width=420,height=720');
  if (!w) { alert('Pop-up bloquée : autorisez les pop-ups pour imprimer.'); return; }
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Reçu #${sale.receiptNumber}</title>
    <style>body{font-family:'Courier New',monospace;font-size:12px;margin:14px;color:#000}pre{white-space:pre-wrap;word-break:break-word;margin:0}</style>
    </head><body><pre>${esc(buildReceiptText(sale))}</pre></body></html>`);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 300);
}

/* ---- Écran de confirmation ---- */
function showSaleConfirmation(sale) {
  state.lastSale = sale;
  els.confirmBody.innerHTML = `
    <div class="info-box">
      <div><strong>Reçu #${sale.receiptNumber}</strong> — ${esc(sale.customerName)}</div>
      <div>Total : <strong>${formatCurrency(sale.total)}</strong></div>
      <div>Versé : ${formatCurrency(sale.montantPaye)} (${esc(getPaymentModesLabel(sale))})</div>
      <div>Balance restante : <strong>${formatCurrency(sale.balanceRestante)}</strong></div>
      ${sale.balanceRestante > 0 && sale.echeance ? `<div>Échéance : ${formatDateOnly(sale.echeance)}</div>` : ''}
      <div style="margin-top:8px;">${badgeHtml(sale.statutPaiement)} ${esc(STATUS_LABELS[sale.statutPaiement])}</div>
    </div>`;
  showModal(els.confirmModal);
}

/* =========================================================
   VALIDATION DE VENTE
   ========================================================= */
async function validateSale() {
  if (!state.selectedCustomer) { alert('Sélectionnez un client avant de valider la vente.'); return; }
  if (!state.cart.length) { alert('Ajoutez au moins un article au panier.'); return; }

  const seller = normalizeWhitespace(els.sellerSelect.value) || 'Vendeur non défini';
  const operator = normalizeWhitespace(els.operatorSelect.value) || seller;
  const paymentMode = normalizeWhitespace(els.paymentMode.value) || 'Cash';
  const pricing = getDiscountedTotal();
  const pay = updatePaymentSummary();

  if (pay.balance > 0 && els.dueDate.value && els.dueDate.value < todayIso()) {
    if (!window.confirm('La date d\'échéance est déjà passée. Continuer ?')) return;
  }

  els.confirmSale.disabled = true;
  try {
    const timestamp = new Date().toISOString();
    const countBefore = Number(state.selectedCustomer.nb_achats || 0);
    const countAfter = countBefore >= 10 ? 0 : countBefore + 1;
    const history = pay.paid > 0
      ? [{ date: timestamp, montant: pay.paid, mode_paiement: paymentMode, note: pay.balance > 0 ? 'Acompte à la vente' : 'Paiement à la vente' }]
      : [];

    const sale = {
      receiptNumber: await getReceiptNumber(),
      timestamp,
      customerId: state.selectedCustomer.id,
      customerName: state.selectedCustomer.name || `${state.selectedCustomer.firstname || ''} ${state.selectedCustomer.lastname || ''}`.trim() || 'Client',
      cardNumber: state.selectedCustomer.cardNumber || 'HM-0000',
      seller,
      paymentMode,
      total: pay.total,
      montantPaye: pay.paid,
      balanceRestante: pay.balance,
      statutPaiement: pay.status,
      echeance: pay.balance > 0 ? (els.dueDate.value || null) : null,
      historique: history,
      auditLog: [makeAudit(operator, 'CREATION', `Fiche créée — total ${formatPrice(pay.total)}, versé ${formatPrice(pay.paid)}`)],
      originalTotal: round(pricing.subtotal),
      discount: pricing.discountAmount,
      items: state.cart.map((item) => ({
        id: item.id, name: item.name, quantity: item.quantity,
        price: Number(item.price || 0), total: round(item.price * item.quantity)
      })),
      loyaltyLevel: Math.min(countAfter, 10),
      loyaltyBenefit: pricing.benefit,
      customer: { ...state.selectedCustomer },
      discountRate: Number(pricing.discountRate || 0)
    };

    const created = await createSaleRecord(sale);
    if (!created) return;

    await updateCustomerRecord(state.selectedCustomer.id, { nb_achats: countAfter, last_sale_at: timestamp });
    replaceSaleInState(created);
    await refreshCustomers();

    resetSaleForm();
    showSaleConfirmation(created);
    if (els.autoWhatsapp.checked) openWhatsAppReceipt(created);
    renderReportDashboard({ refresh: false });
  } finally {
    els.confirmSale.disabled = false;
  }
}

function resetSaleForm() {
  state.cart = [];
  state.amountPaidTouched = false;
  els.amountPaid.value = '';
  els.dueDate.value = '';
  els.sellerSelect.value = '';
  els.paymentMode.value = 'Cash';
  els.clientSearch.value = '';
  renderCustomerCard(null);   // remet aussi le panier à jour
}

function clearCurrentSale() {
  resetSaleForm();
  toggleCustomerCreation(true);
}

/* =========================================================
   CRÉANCES & BALANCES
   ========================================================= */
function renderCreancesTable() {
  const search = normalizeWhitespace(els.creanceSearch.value).toLowerCase();
  const status = els.creanceStatus.value;
  const today = todayIso();

  const open = state.sales.filter((s) => s.balanceRestante > 0);
  const list = open.filter((s) => {
    if (status && s.statutPaiement !== status) return false;
    if (!search) return true;
    return `${s.customerName} ${s.cardNumber} ${s.receiptNumber}`.toLowerCase().includes(search);
  }).sort((a, b) => {
    // échéances les plus proches d'abord ; sans échéance en dernier
    const ea = a.echeance || '9999-12-31', eb = b.echeance || '9999-12-31';
    return ea === eb ? new Date(a.timestamp) - new Date(b.timestamp) : ea.localeCompare(eb);
  });

  els.creanceKpiTotal.textContent = formatCurrency(open.reduce((t, s) => t + s.balanceRestante, 0));
  els.creanceKpiCount.textContent = String(open.length);
  els.creanceKpiOverdue.textContent = String(open.filter((s) => s.echeance && s.echeance < today).length);

  if (!list.length) {
    els.creancesRows.innerHTML = '<tr><td colspan="9" class="muted" style="padding:18px; text-align:center;">Aucune créance en cours.</td></tr>';
    return;
  }

  els.creancesRows.innerHTML = list.map((s) => {
    const late = s.echeance && s.echeance < today;
    return `
    <tr>
      <td>#${s.receiptNumber}</td>
      <td>${formatDateTime(s.timestamp)}</td>
      <td>${esc(s.customerName)}<br><small class="muted">${esc(s.cardNumber)}</small></td>
      <td>${formatCurrency(s.total)}</td>
      <td>${formatCurrency(s.montantPaye)}</td>
      <td><strong>${formatCurrency(s.balanceRestante)}</strong></td>
      <td class="${late ? 'overdue' : ''}">${formatDateOnly(s.echeance)}${late ? ' ⚠' : ''}</td>
      <td>${badgeHtml(s.statutPaiement)}</td>
      <td><div class="row-actions">
        <button type="button" class="act-pay" data-act="pay" data-id="${esc(s.id)}">+ Versement</button>
        <button type="button" class="act-wa" data-act="remind" data-id="${esc(s.id)}">Relance WhatsApp</button>
        <button type="button" data-act="log" data-id="${esc(s.id)}">Journal</button>
      </div></td>
    </tr>`;
  }).join('');
}

function openPaymentModal(sale) {
  state.paymentTarget = sale;
  els.paymentInfo.innerHTML = `
    <strong>Fiche #${sale.receiptNumber}</strong> — ${esc(sale.customerName)}<br>
    Total : ${formatCurrency(sale.total)} · Versé : ${formatCurrency(sale.montantPaye)}<br>
    Balance restante : <strong>${formatCurrency(sale.balanceRestante)}</strong>`;
  els.paymentAmount.max = sale.balanceRestante;
  els.paymentAmount.value = sale.balanceRestante;
  els.paymentModeInput.value = 'Cash';
  els.paymentNote.value = '';
  showModal(els.paymentModal);
  els.paymentAmount.focus();
}

async function submitPayment(event) {
  event.preventDefault();
  const target = state.paymentTarget;
  if (!target) return;
  const operator = getOperator();
  if (!operator) return;

  // On relit la fiche pour ne pas écraser un versement saisi depuis un autre poste.
  const fresh = (await fetchSaleById(target.id)) || target;
  const amount = round(els.paymentAmount.value);
  if (!(amount > 0)) { alert('Saisissez un montant supérieur à 0.'); return; }
  if (amount > fresh.balanceRestante) {
    alert(`Le versement dépasse la balance restante (${formatCurrency(fresh.balanceRestante)}).`);
    return;
  }

  const mode = els.paymentModeInput.value;
  const pay = computePayment(fresh.total, fresh.montantPaye + amount);
  const historique = [...fresh.historique, {
    date: new Date().toISOString(), montant: amount, mode_paiement: mode,
    note: normalizeWhitespace(els.paymentNote.value)
  }];
  const auditLog = [...fresh.auditLog, makeAudit(operator, 'VERSEMENT',
    `+${formatPrice(amount)} (${mode}) — reste ${formatPrice(pay.balance)}`)];

  const updated = await updateSaleRecord(fresh.id, salePaymentToDb({
    total: fresh.total, montantPaye: pay.paid, balanceRestante: pay.balance, statutPaiement: pay.status,
    echeance: pay.balance > 0 ? fresh.echeance : null, historique, auditLog
  }));
  if (!updated) return;

  replaceSaleInState(updated);
  hideModal(els.paymentModal);
  state.paymentTarget = null;
  renderCreancesTable();
  renderReportDashboard({ refresh: false });

  if (window.confirm(`Versement enregistré (statut : ${updated.statutPaiement}).\nEnvoyer le reçu mis à jour par WhatsApp ?`)) {
    openWhatsAppReceipt(updated);
  }
}

/* =========================================================
   RAPPORTS (période, KPI, tableau, Excel)
   ========================================================= */
function syncReportControls() {
  const range = els.reportRange.value;
  els.reportMonthWrap.classList.toggle('hidden', range !== 'month');
  els.reportYearWrap.classList.toggle('hidden', range !== 'month' && range !== 'year');
}

function populateReportFilters(sales = state.sales) {
  const now = new Date();
  const years = new Set([now.getFullYear()]);
  sales.forEach((s) => {
    const y = new Date(s.timestamp).getFullYear();
    if (y) years.add(y);
    (s.historique || []).forEach((p) => { const py = new Date(p.date).getFullYear(); if (py) years.add(py); });
  });
  const sorted = [...years].sort((a, b) => b - a);

  const prevYear = els.reportYear.value;
  const prevMonth = els.reportMonth.value;

  els.reportYear.innerHTML = sorted.map((y) => `<option value="${y}">${y}</option>`).join('');
  els.reportMonth.innerHTML = MONTHS.map((m, i) => `<option value="${i}">${m}</option>`).join('');
  els.reportYear.value = prevYear && sorted.includes(Number(prevYear)) ? prevYear : String(now.getFullYear());
  els.reportMonth.value = prevMonth !== '' ? prevMonth : String(now.getMonth());
  syncReportControls();
}

function getPeriodBounds() {
  const range = els.reportRange.value || 'month';
  const now = new Date();
  const year = Number(els.reportYear.value) || now.getFullYear();
  const month = els.reportMonth.value !== '' ? Number(els.reportMonth.value) : now.getMonth();

  if (range === 'all') return { start: null, end: null, label: 'tout-historique' };
  if (range === 'day') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { start, end: new Date(start.getTime() + 86400000), label: todayIso() };
  }
  if (range === 'week') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    return { start, end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1), label: '7-derniers-jours' };
  }
  if (range === 'year') return { start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1), label: String(year) };
  return { start: new Date(year, month, 1), end: new Date(year, month + 1, 1), label: `${year}-${String(month + 1).padStart(2, '0')}` };
}

function inPeriod(iso, bounds) {
  if (!bounds.start) return true;
  const d = new Date(iso);
  return d >= bounds.start && d < bounds.end;
}

async function renderReportDashboard({ refresh = true } = {}) {
  if (refresh) await refreshSales();
  const bounds = getPeriodBounds();
  const search = normalizeWhitespace(els.reportCustomerSearch.value).toLowerCase();

  const scoped = state.sales.filter((s) =>
    !search || `${s.customerName} ${s.cardNumber}`.toLowerCase().includes(search));
  const rows = scoped.filter((s) => inPeriod(s.timestamp, bounds));
  state.reportRows = rows;

  // Encaissements effectifs = versements datés dans la période (pas le montant facturé).
  const byMode = {};
  let collected = 0;
  let globalCollected = 0;
  scoped.forEach((s) => (s.historique || []).forEach((p) => {
    const amount = Number(p.montant || 0);
    globalCollected += amount;
    if (inPeriod(p.date, bounds)) {
      collected += amount;
      const mode = p.mode_paiement || 'Autre';
      byMode[mode] = (byMode[mode] || 0) + amount;
    }
  }));

  const billed = rows.reduce((t, s) => t + s.total, 0);
  const known = ['Cash', 'MonCash', 'Natcash'];
  const other = Object.entries(byMode).filter(([m]) => !known.includes(m)).reduce((t, [, v]) => t + v, 0);

  els.kpiRevenue.textContent = formatCurrency(collected);
  els.kpiGlobal.textContent = formatCurrency(globalCollected);
  els.kpiSalesCount.textContent = String(rows.length);
  els.kpiAverageTicket.textContent = formatCurrency(rows.length ? billed / rows.length : 0);
  els.kpiDiscountTotal.textContent = formatCurrency(rows.reduce((t, s) => t + s.discount, 0));
  els.kpiCash.textContent = formatCurrency(byMode.Cash || 0);
  els.kpiMoncash.textContent = formatCurrency(byMode.MonCash || 0);
  els.kpiNatcash.textContent = formatCurrency(byMode.Natcash || 0);
  els.kpiOther.textContent = formatCurrency(other);

  if (!rows.length) {
    els.reportRows.innerHTML = '<tr><td colspan="9" class="muted" style="padding:18px; text-align:center;">Aucune vente pour cette période.</td></tr>';
    return;
  }

  els.reportRows.innerHTML = rows.map((s) => `
    <tr>
      <td>${formatDateTime(s.timestamp)}</td>
      <td>#${s.receiptNumber}</td>
      <td>${esc(s.customerName)}</td>
      <td>${esc(s.seller)}</td>
      <td>${formatCurrency(s.total)}</td>
      <td>${formatCurrency(s.montantPaye)}</td>
      <td>${formatCurrency(s.balanceRestante)}</td>
      <td>${badgeHtml(s.statutPaiement)}</td>
      <td><div class="row-actions">
        <button type="button" class="act-wa" data-act="wa" data-id="${esc(s.id)}">Reçu WhatsApp</button>
        <button type="button" data-act="print" data-id="${esc(s.id)}">Imprimer</button>
        <button type="button" data-act="edit" data-id="${esc(s.id)}">Modifier la Fiche</button>
        ${s.balanceRestante > 0 ? `<button type="button" class="act-pay" data-act="pay" data-id="${esc(s.id)}">+ Versement</button>` : ''}
        <button type="button" data-act="log" data-id="${esc(s.id)}">Journal</button>
        <button type="button" class="act-del" data-act="delete" data-id="${esc(s.id)}">Supprimer</button>
      </div></td>
    </tr>`).join('');
}

function downloadReport() {
  const rows = state.reportRows;
  if (!rows.length) { alert('Aucune vente à exporter pour cette période.'); return; }
  const header = ['Date', 'Reçu #', 'Client', 'Vendeur', 'Total', 'Payé', 'Reste', 'Statut'];
  const data = rows.map((s) => ({
    'Date': formatDateTime(s.timestamp),
    'Reçu #': s.receiptNumber,
    'Client': s.customerName,
    'Vendeur': s.seller,
    'Total': s.total,
    'Payé': s.montantPaye,
    'Reste': s.balanceRestante,
    'Statut': STATUS_LABELS[s.statutPaiement]
  }));
  const label = getPeriodBounds().label;

  if (window.XLSX) {
    const ws = XLSX.utils.json_to_sheet(data, { header });
    ws['!cols'] = [{ wch: 18 }, { wch: 9 }, { wch: 26 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 24 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventes');
    XLSX.writeFile(wb, `rapport-ventes-${label}.xlsx`);
    return;
  }

  // Secours si la librairie SheetJS n'a pas pu se charger.
  const csv = [header.join(',')].concat(data.map((r) =>
    header.map((h) => `"${String(r[h]).replace(/"/g, '""')}"`).join(','))).join('\n');
  const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url; a.download = `rapport-ventes-${label}.csv`; a.click();
  URL.revokeObjectURL(url);
}

/* ---- Journal d'une fiche ---- */
function openHistoryModal(sale) {
  els.historyTitle.textContent = `Journal — fiche #${sale.receiptNumber} (${sale.customerName})`;
  const pays = (sale.historique || []).map((p) =>
    `<li>${formatDateTime(p.date)} — <strong>${formatCurrency(p.montant)}</strong> (${esc(p.mode_paiement || '—')})${p.note ? ` · ${esc(p.note)}` : ''}</li>`).join('');
  const audit = (sale.auditLog || []).map((a) =>
    `<li>${formatDateTime(a.date)} — <strong>${esc(a.auteur)}</strong> · ${esc(a.action)}${a.details ? ` : ${esc(a.details)}` : ''}</li>`).join('');
  els.historyBody.innerHTML = `
    <div><strong>Historique des paiements</strong><ul class="log-list">${pays || '<li class="muted">Aucun versement.</li>'}</ul></div>
    <div><strong>Journal d'audit</strong><ul class="log-list">${audit || '<li class="muted">Aucune entrée (fiche antérieure au journal).</li>'}</ul></div>`;
  showModal(els.historyModal);
}

/* =========================================================
   ÉDITION D'UNE FICHE
   ========================================================= */
function openEditSaleModal(sale) {
  state.editDraft = {
    sale,
    customer: {
      id: sale.customerId, name: sale.customerName, cardNumber: sale.cardNumber,
      phone: sale.customer?.phone || ''
    },
    items: sale.items.map((i) => ({ id: i.id, name: i.name, quantity: Number(i.quantity), price: Number(i.price) }))
  };
  els.editSaleTitle.textContent = `Modifier la fiche #${sale.receiptNumber}`;
  els.editCustomerSearch.value = '';
  updateEditCustomerLabel();

  const sellers = SELLERS.includes(sale.seller) ? SELLERS : [sale.seller, ...SELLERS];
  els.editSeller.innerHTML = sellers.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
  els.editSeller.value = sale.seller;
  els.editDiscount.value = sale.discount || 0;
  els.editEcheance.value = sale.echeance || '';
  els.editAddProduct.innerHTML = state.products.map((p) =>
    `<option value="${esc(p.id)}">${esc(p.name)} — ${formatPrice(p.price)}</option>`).join('');

  renderEditItems();
  showModal(els.editSaleModal);
}

function updateEditCustomerLabel() {
  const c = state.editDraft.customer;
  els.editCustomerLabel.textContent = `Client actuel : ${c.name} (${c.cardNumber})`;
}

function renderEditItems() {
  const d = state.editDraft;
  els.editItems.innerHTML = d.items.length ? d.items.map((it, i) => `
    <tr>
      <td><input type="number" min="1" step="1" value="${it.quantity}" data-edit-field="quantity" data-i="${i}" style="width:80px" /></td>
      <td><input type="text" value="${esc(it.name)}" data-edit-field="name" data-i="${i}" /></td>
      <td><input type="number" min="0" step="1" value="${it.price}" data-edit-field="price" data-i="${i}" style="width:110px" /></td>
      <td data-line-total="${i}">${formatPrice(it.price * it.quantity)}</td>
      <td><button type="button" class="remove-btn" data-edit-remove="${i}">Suppr.</button></td>
    </tr>`).join('')
    : '<tr><td colspan="5" class="muted" style="padding:14px;text-align:center;">Aucun article.</td></tr>';
  updateEditSummary();
}

function getEditTotals() {
  const d = state.editDraft;
  const subtotal = round(d.items.reduce((t, i) => t + Number(i.price || 0) * Number(i.quantity || 0), 0));
  const discount = round(Math.min(Math.max(Number(els.editDiscount.value) || 0, 0), subtotal));
  const total = round(subtotal - discount);
  return { subtotal, discount, total, pay: computePayment(total, d.sale.montantPaye) };
}

function updateEditSummary() {
  const { subtotal, total, pay } = getEditTotals();
  els.editSubtotal.textContent = formatCurrency(subtotal);
  els.editTotal.textContent = formatCurrency(total);
  els.editPaid.textContent = formatCurrency(pay.paid);
  els.editBalance.textContent = formatCurrency(pay.balance);
  setBadge(els.editStatus, pay.status);
}

async function saveEditedSale() {
  const d = state.editDraft;
  if (!d) return;
  const operator = getOperator();
  if (!operator) return;
  if (!d.items.length) { alert('La fiche doit contenir au moins un article.'); return; }
  if (d.items.some((i) => !normalizeWhitespace(i.name) || !(Number(i.quantity) > 0) || Number(i.price) < 0)) {
    alert('Vérifiez les articles : nom, quantité (> 0) et prix (≥ 0) sont obligatoires.');
    return;
  }

  const fresh = (await fetchSaleById(d.sale.id)) || d.sale;
  const { subtotal, discount, total } = getEditTotals();
  const pay = computePayment(total, fresh.montantPaye);
  if (fresh.montantPaye > total && !window.confirm(
    `Le montant déjà payé (${formatPrice(fresh.montantPaye)}) dépasse le nouveau total (${formatPrice(total)}).\n` +
    'Un remboursement éventuel devra être géré manuellement. Continuer ?')) return;

  const items = d.items.map((i) => ({
    id: i.id, name: normalizeWhitespace(i.name), quantity: Number(i.quantity),
    price: Number(i.price), total: round(i.price * i.quantity)
  }));
  const seller = els.editSeller.value;
  const echeance = pay.balance > 0 ? (els.editEcheance.value || null) : null;
  const customerChanged = String(d.customer.id) !== String(fresh.customerId);

  const changes = [];
  if (customerChanged) changes.push(`client ${fresh.customerName} → ${d.customer.name}`);
  if (JSON.stringify(items.map((i) => [i.name, i.quantity, i.price])) !== JSON.stringify(fresh.items.map((i) => [i.name, Number(i.quantity), Number(i.price)]))) changes.push('articles modifiés');
  if (discount !== fresh.discount) changes.push(`remise ${formatPrice(fresh.discount)} → ${formatPrice(discount)}`);
  if (total !== fresh.total) changes.push(`total ${formatPrice(fresh.total)} → ${formatPrice(total)}`);
  if (seller !== fresh.seller) changes.push(`vendeur ${fresh.seller} → ${seller}`);
  if ((echeance || '') !== (fresh.echeance || '')) changes.push(`échéance ${formatDateOnly(fresh.echeance)} → ${formatDateOnly(echeance)}`);

  const auditLog = [...fresh.auditLog, makeAudit(operator, 'MODIFICATION', changes.join(' ; ') || 'Aucun changement notable')];

  els.editSave.disabled = true;
  try {
    const updated = await updateSaleRecord(fresh.id, {
      seller,
      customer_id: d.customer.id,
      customer_name: d.customer.name,
      card_number: d.customer.cardNumber,
      customer: { ...fresh.customer, id: d.customer.id, name: d.customer.name, phone: d.customer.phone, cardNumber: d.customer.cardNumber },
      items,
      original_total: subtotal,
      discount,
      discount_rate: subtotal > 0 ? round(discount / subtotal) : 0,
      ...salePaymentToDb({
        total, montantPaye: pay.paid, balanceRestante: pay.balance, statutPaiement: pay.status,
        echeance, historique: fresh.historique, auditLog
      })
    });
    if (!updated) return;

    // Le tampon fidélité suit la fiche si le client change.
    if (customerChanged) {
      await adjustCustomerStampCount(fresh.customerId, -1);
      await adjustCustomerStampCount(d.customer.id, +1);
      await refreshCustomers();
    }

    replaceSaleInState(updated);
    hideModal(els.editSaleModal);
    state.editDraft = null;
    renderReportDashboard({ refresh: false });
    renderCreancesTable();
  } finally {
    els.editSave.disabled = false;
  }
}

/* =========================================================
   SUPPRESSION D'UNE FICHE
   ========================================================= */
async function deleteSale(sale) {
  if (!sale || !supabaseClient) return;
  if (!requireAdmin(`supprimer la fiche #${sale.receiptNumber} (${sale.customerName})`)) return;

  const { error } = await supabaseClient.from('sales').delete().eq('id', sale.id);
  if (error) { console.error(error); alert('Impossible de supprimer cette vente.'); return; }
  if (sale.customerId) await adjustCustomerStampCount(sale.customerId, -1);

  state.sales = state.sales.filter((s) => String(s.id) !== String(sale.id));
  await refreshCustomers();
  renderReportDashboard({ refresh: false });
  renderCreancesTable();
}

/* =========================================================
   ÉVÉNEMENTS
   ========================================================= */
function handleSaleAction(event) {
  const btn = event.target.closest('[data-act]');
  if (!btn) return;
  const sale = state.sales.find((s) => String(s.id) === String(btn.dataset.id));
  if (!sale) return;
  switch (btn.dataset.act) {
    case 'wa': openWhatsAppReceipt(sale); break;
    case 'print': printReceipt(sale); break;
    case 'edit': openEditSaleModal(sale); break;
    case 'pay': openPaymentModal(sale); break;
    case 'remind': sendReminder(sale); break;
    case 'log': openHistoryModal(sale); break;
    case 'delete': deleteSale(sale); break;
  }
}

async function runCustomerSearch() {
  const found = await searchCustomer(els.clientSearch.value);
  setCustomerFormMode('create');
  renderCustomerCard(found);
}

function setupEvents() {
  // navigation & opérateur
  els.navButtons.forEach((b) => b.addEventListener('click', () => showView(b.dataset.nav)));
  els.operatorSelect.addEventListener('change', () => localStorage.setItem('hm_operator', els.operatorSelect.value));
  els.autoWhatsapp.addEventListener('change', () => localStorage.setItem('hm_auto_wa', els.autoWhatsapp.checked ? '1' : '0'));
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => hideModal($(b.dataset.close))));
  document.querySelectorAll('.modal').forEach((m) => m.addEventListener('mousedown', (e) => { if (e.target === m) hideModal(m); }));

  // client
  els.searchClient.addEventListener('click', runCustomerSearch);
  els.clientSearch.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); runCustomerSearch(); } });
  els.clientForm.addEventListener('submit', handleCustomerFormSubmit);
  els.cancelCustomerEdit.addEventListener('click', () => {
    setCustomerFormMode('create');
    toggleCustomerCreation(!state.selectedCustomer);
  });

  // produits
  els.productSearch.addEventListener('input', renderProducts);
  els.quickAddProduct.addEventListener('click', openModal);
  els.quickAddForm.addEventListener('submit', addQuickProduct);
  els.closeModal.addEventListener('click', closeModal);

  // caisse / paiement
  els.amountPaid.addEventListener('input', () => { state.amountPaidTouched = true; updatePaymentSummary(); });
  els.fillFullAmount.addEventListener('click', () => { state.amountPaidTouched = false; updatePaymentSummary(); });
  els.confirmSale.addEventListener('click', validateSale);
  els.resetSale.addEventListener('click', clearCurrentSale);

  // confirmation
  els.confirmSendWa.addEventListener('click', () => state.lastSale && openWhatsAppReceipt(state.lastSale));
  els.confirmPrint.addEventListener('click', () => state.lastSale && printReceipt(state.lastSale));
  els.confirmClose.addEventListener('click', () => hideModal(els.confirmModal));

  // créances
  els.creanceSearch.addEventListener('input', renderCreancesTable);
  els.creanceStatus.addEventListener('change', renderCreancesTable);
  els.creancesRows.addEventListener('click', handleSaleAction);
  els.paymentForm.addEventListener('submit', submitPayment);

  // rapports
  els.reportRange.addEventListener('change', () => { syncReportControls(); renderReportDashboard({ refresh: false }); });
  els.reportMonth.addEventListener('change', () => renderReportDashboard({ refresh: false }));
  els.reportYear.addEventListener('change', () => renderReportDashboard({ refresh: false }));
  els.reportCustomerSearch.addEventListener('input', () => renderReportDashboard({ refresh: false }));
  els.downloadReport.addEventListener('click', downloadReport);
  els.reportRows.addEventListener('click', handleSaleAction);
  els.openCustomerGroupPage.addEventListener('click', () => { window.location.href = './customer-sales-report.html'; });

  // édition de fiche
  els.editItems.addEventListener('input', (e) => {
    const input = e.target.closest('[data-edit-field]');
    if (!input || !state.editDraft) return;
    const i = Number(input.dataset.i);
    const field = input.dataset.editField;
    state.editDraft.items[i][field] = field === 'name' ? input.value : Number(input.value || 0);
    const cell = els.editItems.querySelector(`[data-line-total="${i}"]`);
    const it = state.editDraft.items[i];
    if (cell) cell.textContent = formatPrice(it.price * it.quantity);
    updateEditSummary();
  });
  els.editItems.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-edit-remove]');
    if (!btn) return;
    state.editDraft.items.splice(Number(btn.dataset.editRemove), 1);
    renderEditItems();
  });
  els.editDiscount.addEventListener('input', updateEditSummary);
  els.editAddItem.addEventListener('click', () => {
    const p = state.products.find((x) => String(x.id) === String(els.editAddProduct.value));
    if (!p) return;
    const existing = state.editDraft.items.find((i) => String(i.id) === String(p.id));
    if (existing) existing.quantity += 1;
    else state.editDraft.items.push({ id: p.id, name: p.name, quantity: 1, price: p.price });
    renderEditItems();
  });
  els.editAddExpress.addEventListener('click', () => {
    state.editDraft.items.push({ id: `express-${Date.now()}`, name: 'Article libre', quantity: 1, price: 0 });
    renderEditItems();
  });
  els.editCustomerFind.addEventListener('click', async () => {
    const found = await searchCustomer(els.editCustomerSearch.value);
    if (!found) { alert('Aucun client trouvé.'); return; }
    state.editDraft.customer = {
      id: found.id, cardNumber: found.cardNumber, phone: found.phone,
      name: found.name || `${found.firstname} ${found.lastname}`.trim()
    };
    updateEditCustomerLabel();
  });
  els.editSave.addEventListener('click', saveEditedSale);
}

/* =========================================================
   INITIALISATION
   ========================================================= */
async function init() {
  if (!supabaseClient) {
    console.error('Supabase client not initialized. Check the CDN script and keys.');
    alert('Supabase n\'a pas été initialisé. Vérifie la clé et le script CDN du projet.');
    return;
  }

  setupEvents();
  els.operatorSelect.value = localStorage.getItem('hm_operator') || '';
  els.autoWhatsapp.checked = localStorage.getItem('hm_auto_wa') === '1';
  setCustomerFormMode('create');
  toggleCustomerCreation(true);
  renderCart();

  await Promise.all([loadSettings(), loadProducts()]);
  const [sales, customers] = await Promise.all([readSales(), readCustomers()]);
  state.sales = sales;
  state.customers = customers;

  populateReportFilters();
  renderProducts();
  renderCart();
  await renderReportDashboard({ refresh: false });
  renderCreancesTable();
  await showView('caisse');
}

init();
