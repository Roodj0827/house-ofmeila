const SUPABASE_URL = 'https://zpwxoooqnxvxoahltjkh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_amt16PERz3_dyckZWf3oUA_2SzshhGy';

const supabaseClientFactory = window.supabase && typeof window.supabase.createClient === 'function'
  ? window.supabase.createClient
  : null;
const supabaseClient = supabaseClientFactory ? supabaseClientFactory(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const state = {
  products: [],
  settings: {},
  selectedCustomer: null,
  cart: [],
  selectedCategory: 'all'
};

const els = {
  clientSearch: document.getElementById('client-search'),
  searchClient: document.getElementById('search-client'),
  clientResult: document.getElementById('client-result'),
  customerCreationBox: document.getElementById('customer-creation-box'),
  customerName: document.getElementById('customer-name'),
  customerPhone: document.getElementById('customer-phone'),
  clientForm: document.getElementById('client-form'),
  productSearch: document.getElementById('product-search'),
  productResults: document.getElementById('product-results'),
  categoryFilters: document.getElementById('category-filters'),
  quickAddProduct: document.getElementById('quick-add-product'),
  quickAddModal: document.getElementById('quick-add-modal'),
  quickAddForm: document.getElementById('quick-add-form'),
  quickName: document.getElementById('quick-name'),
  quickPrice: document.getElementById('quick-price'),
  closeModal: document.getElementById('close-modal'),
  cartItems: document.getElementById('cart-items'),
  subtotalAmount: document.getElementById('subtotal-amount'),
  discountAmount: document.getElementById('discount-amount'),
  totalAmount: document.getElementById('total-amount'),
  sellerSelect: document.getElementById('seller-select'),
  paymentMode: document.getElementById('payment-mode'),
  confirmSale: document.getElementById('confirm-sale'),
  loyaltyStatus: document.getElementById('loyalty-status'),
  loyaltyMessage: document.getElementById('loyalty-message'),
  resetSale: document.getElementById('reset-sale'),
  reportRange: document.getElementById('report-range'),
  reportCustomerSearch: document.getElementById('report-customer-search'),
  downloadReport: document.getElementById('download-report'),
  kpiRevenue: document.getElementById('kpi-revenue'),
  kpiSalesCount: document.getElementById('kpi-sales-count'),
  kpiAverageTicket: document.getElementById('kpi-average-ticket'),
  kpiDiscountTotal: document.getElementById('kpi-discount-total'),
  reportRows: document.getElementById('report-rows'),
  openCustomerGroupPage: document.getElementById('open-customer-group-page')
};

function normalizeWhitespace(value) {
  return String(value || '').trim();
}

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
  return {
    id: row.id,
    receiptNumber: Number(row.receipt_number || row.receiptNumber || 0),
    timestamp: row.timestamp || row.created_at || new Date().toISOString(),
    customerId: row.customer_id || row.customerId || null,
    customerName: row.customer_name || row.customerName || 'Client',
    cardNumber: row.card_number || row.cardNumber || 'HM-0000',
    seller: row.seller || 'Vendeur non défini',
    paymentMode: row.payment_mode || row.paymentMode || 'Cash',
    total: Number(row.total || 0),
    originalTotal: Number(row.original_total || row.originalTotal || 0),
    discount: Number(row.discount || 0),
    items: Array.isArray(row.items) ? row.items : [],
    loyaltyLevel: Number(row.loyalty_level || row.loyaltyLevel || 0),
    loyaltyBenefit: row.loyalty_benefit || row.loyaltyBenefit || 'Aucun avantage',
    customer: row.customer || {},
    discountRate: Number(row.discount_rate || row.discountRate || 0)
  };
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString('fr-FR')} HTG`;
}

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString('fr-FR')} HTG`;
}

function getJsonPath(path) {
  return window.location.pathname.includes('/admin/') ? `../${path}` : `/${path}`;
}

async function loadSettings() {
  const response = await fetch(getJsonPath('data/settings.json'));
  if (!response.ok) return;
  state.settings = await response.json();
}

async function readCustomers() {
  if (!supabaseClient) return [];
  const { data, error } = await supabaseClient.from('customers').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return (data || []).map(mapCustomerRow).filter(Boolean);
}

async function createCustomerRecord(payload) {
  if (!supabaseClient) {
    alert('Supabase n\'est pas chargé. Vérifie le script CDN.');
    return null;
  }

  const { data, error } = await supabaseClient.from('customers').insert([
    {
      name: payload.name,
      firstname: payload.firstname || payload.name,
      lastname: payload.lastname || '',
      phone: payload.phone,
      card_number: payload.cardNumber,
      nb_achats: Number(payload.nb_achats || 0),
      last_sale_at: payload.lastSaleAt || null
    }
  ]).select();

  if (error) {
    console.error(error);
    alert('Impossible d\'enregistrer ce client dans Supabase.');
    return null;
  }

  return mapCustomerRow(data?.[0] || null);
}

async function updateCustomerRecord(id, updates) {
  if (!supabaseClient || !id) return null;
  const { data, error } = await supabaseClient.from('customers').update(updates).eq('id', id).select();
  if (error) {
    console.error(error);
    return null;
  }
  return mapCustomerRow(data?.[0] || null);
}

async function readSales() {
  if (!supabaseClient) return [];
  const { data, error } = await supabaseClient.from('sales').select('*').order('timestamp', { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return (data || []).map(mapSaleRow).filter(Boolean);
}

async function createSaleRecord(payload) {
  if (!supabaseClient) {
    alert('Supabase n\'est pas chargé.');
    return null;
  }

  const { data, error } = await supabaseClient.from('sales').insert([
    {
      receipt_number: payload.receiptNumber,
      timestamp: payload.timestamp,
      customer_id: payload.customerId,
      customer_name: payload.customerName,
      card_number: payload.cardNumber,
      seller: payload.seller,
      payment_mode: payload.paymentMode,
      total: Number(payload.total || 0),
      original_total: Number(payload.originalTotal || 0),
      discount: Number(payload.discount || 0),
      items: payload.items,
      loyalty_level: Number(payload.loyaltyLevel || 0),
      loyalty_benefit: payload.loyaltyBenefit,
      customer: payload.customer,
      discount_rate: Number(payload.discountRate || 0)
    }
  ]).select();

  if (error) {
    console.error(error);
    alert('Impossible d\'enregistrer la vente dans Supabase.');
    return null;
  }

  return mapSaleRow(data?.[0] || null);
}

async function loadProducts() {
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
  renderCategoryFilters();
  renderProducts();
}

function renderCategoryFilters() {
  if (!els.categoryFilters) return;

  const categories = Array.from(new Set(state.products.map((product) => product.category || 'autres')))
    .sort((a, b) => a.localeCompare(b, 'fr'));

  const chips = [{ key: 'all', label: 'Tous' }, ...categories.map((category) => ({ key: category, label: category }))];

  els.categoryFilters.innerHTML = chips.map((chip) => `
    <button type="button" class="category-chip${state.selectedCategory === chip.key ? ' active' : ''}" data-category="${chip.key}">${chip.label}</button>
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
    const matchesCategory = state.selectedCategory === 'all' || (product.category || 'autres') === state.selectedCategory;
    if (!matchesCategory) return false;
    if (!query) return true;
    return product.name.toLowerCase().includes(query) || (product.category || '').toLowerCase().includes(query);
  });

  if (!rows.length) {
    els.productResults.innerHTML = '<div class="muted">Aucun produit trouvé.</div>';
    return;
  }

  els.productResults.innerHTML = rows.map((product) => `
    <div class="product-card">
      <img src="${product.image || '../favicon.png'}" alt="${product.name}" />
      <div class="product-name">${product.name}</div>
      <div class="product-meta">
        <span>${product.category}</span>
        <strong>${formatPrice(product.price)}</strong>
      </div>
      <button type="button" class="mini-btn" data-product-id="${product.id}">Ajouter</button>
    </div>
  `).join('');

  document.querySelectorAll('[data-product-id]').forEach((button) => {
    button.addEventListener('click', () => addToCart(button.dataset.productId));
  });
}

function addToCart(productId) {
  const selected = state.products.find((product) => String(product.id) === String(productId));
  if (!selected) return;

  const existing = state.cart.find((item) => String(item.id) === String(productId));
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({
      id: selected.id,
      name: selected.name,
      price: Number(selected.price || 0),
      quantity: 1,
      source: 'catalog'
    });
  }

  const trigger = document.querySelector(`[data-product-id="${productId}"]`);
  if (trigger) {
    trigger.classList.add('added');
    trigger.textContent = 'Ajouté ✓';
    setTimeout(() => {
      trigger.classList.remove('added');
      trigger.textContent = 'Ajouter';
    }, 500);
  }

  renderCart();
}

function changeQuantity(productId, delta) {
  const item = state.cart.find((entry) => String(entry.id) === String(productId));
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    state.cart = state.cart.filter((entry) => String(entry.id) !== String(productId));
  }

  renderCart();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter((entry) => String(entry.id) !== String(productId));
  renderCart();
}

function getCartTotal() {
  return state.cart.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 0), 0);
}

function getLoyaltyStatus(customer) {
  const value = Number(customer?.nb_achats || 0);
  const level = Math.min(value, 10);

  if (level >= 10) return { label: 'Tampon 10/10', discount: 0.5, message: 'Avantage appliqué : 50% sur la vente.', benefit: '50% de réduction' };
  if (level >= 7) return { label: 'Tampon 7/10', discount: 0.3, message: 'Avantage appliqué : 30% de réduction.', benefit: '30% de réduction' };
  if (level >= 5) return { label: 'Tampon 5/10', discount: 0, message: 'Avantage appliqué : Cadeau 🎁.', benefit: 'Cadeau 🎁' };
  if (level >= 3) return { label: 'Tampon 3/10', discount: 0.1, message: 'Avantage appliqué : 10% de réduction.', benefit: '10% de réduction' };
  return { label: 'Aucun tampon', discount: 0, message: 'Aucun avantage fidélité pour cette carte.', benefit: 'Aucun avantage' };
}

function getDiscountedTotal() {
  const subtotal = getCartTotal();
  const status = getLoyaltyStatus(state.selectedCustomer);
  const discountAmount = subtotal * status.discount;
  const finalTotal = subtotal - discountAmount;
  return { subtotal, discountRate: status.discount, discountAmount, finalTotal, benefit: status.benefit || 'Aucun avantage' };
}

function renderCart() {
  const pricing = getDiscountedTotal();

  if (!state.cart.length) {
    els.cartItems.innerHTML = '<tr><td colspan="4" class="muted" style="padding: 18px; text-align: center;">Le panier est vide.</td></tr>';
    els.subtotalAmount.textContent = '0 HTG';
    els.discountAmount.textContent = '0 HTG';
    els.totalAmount.textContent = '0 HTG';
    return;
  }

  els.cartItems.innerHTML = state.cart.map((item) => `
    <tr>
      <td class="qty-cell">
        <div class="qty-adjust">
          <button type="button" class="qty-btn" data-qty-action="decrease" data-id="${item.id}">−</button>
          <span class="qty-value">${item.quantity}</span>
          <button type="button" class="qty-btn" data-qty-action="increase" data-id="${item.id}">+</button>
        </div>
      </td>
      <td>${item.name}</td>
      <td>${formatPrice(item.price)}</td>
      <td>${formatPrice(item.price * item.quantity)}</td>
      <td><button type="button" class="remove-btn" data-remove-id="${item.id}">Suppr.</button></td>
    </tr>
  `).join('');

  document.querySelectorAll('[data-qty-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const delta = button.dataset.qtyAction === 'increase' ? 1 : -1;
      changeQuantity(button.dataset.id, delta);
    });
  });

  document.querySelectorAll('[data-remove-id]').forEach((button) => {
    button.addEventListener('click', () => removeFromCart(button.dataset.removeId));
  });

  const subtotal = pricing.subtotal > 0 ? pricing.subtotal : 0;
  const discount = pricing.discountAmount > 0 ? pricing.discountAmount : 0;
  const finalTotal = pricing.finalTotal > 0 ? pricing.finalTotal : 0;

  els.subtotalAmount.textContent = formatCurrency(subtotal);
  els.discountAmount.textContent = discount > 0 ? `- ${formatCurrency(discount)}` : '0 HTG';
  els.totalAmount.textContent = formatCurrency(finalTotal);
}

async function searchCustomer(query) {
  if (!supabaseClient) return null;

  const clean = normalizeWhitespace(query).toLowerCase();

  if (!clean) {
    const { data, error } = await supabaseClient
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) {
      console.error(error);
      return null;
    }
    return mapCustomerRow(data?.[0] || null);
  }

  const digits = clean.replace(/\D/g, '');
  const escaped = clean.replace(/[%_,]/g, '');
  const filters = [
    `card_number.ilike.%${escaped}%`,
    `firstname.ilike.%${escaped}%`,
    `lastname.ilike.%${escaped}%`,
    `name.ilike.%${escaped}%`
  ];
  if (digits) {
    filters.push(`phone.ilike.%${digits}%`);
  }

  const { data, error } = await supabaseClient
    .from('customers')
    .select('*')
    .or(filters.join(','))
    .limit(5);

  if (error) {
    console.error(error);
    return null;
  }

  return mapCustomerRow((data || [])[0] || null);
}

function renderCustomerCard(customer) {
  if (!customer) {
    els.clientResult.className = 'client-card empty';
    els.clientResult.innerHTML = '<p class="muted">Aucun client sélectionné.</p>';
    els.loyaltyStatus.textContent = 'Aucune carte';
    els.loyaltyMessage.textContent = 'Aucune carte active.';
    
    // Afficher le formulaire de création si aucun client trouvé / sélectionné
    toggleCustomerCreation(true);
    return;
  }

  state.selectedCustomer = customer;
  els.clientResult.className = 'client-card';
  const clientName = customer.name || `${customer.firstname || ''} ${customer.lastname || ''}`.trim() || 'Client';

  els.clientResult.innerHTML = `
    <div class="client-card-head">
      <h3>${clientName}</h3>
      <span class="client-code">${customer.cardNumber || 'HM-0000'}</span>
    </div>
    <div class="client-meta">
      <span>📞 ${customer.phone || '—'}</span>
      <span>🧾 Tampons : ${Number(customer.nb_achats || 0)}/10</span>
    </div>
    <div class="client-card-actions">
      <button type="button" id="client-options-toggle" class="ghost-btn small" title="Options client">⋯</button>
      <button type="button" id="delete-customer-btn" class="remove-btn hidden">Supprimer ce client</button>
    </div>
  `;

  const status = getLoyaltyStatus(customer);
  els.loyaltyStatus.textContent = status.label;
  els.loyaltyMessage.textContent = status.message;

  const optionsToggle = document.getElementById('client-options-toggle');
  const deleteBtn = document.getElementById('delete-customer-btn');
  if (optionsToggle && deleteBtn) {
    optionsToggle.addEventListener('click', () => {
      deleteBtn.classList.toggle('hidden');
    });
    deleteBtn.addEventListener('click', handleDeleteCustomerClick);
  }

  // Masquer le formulaire Nouveau client puisqu'un client est trouvé !
  toggleCustomerCreation(false);
}

async function buildCustomerNumber() {
  const customers = await readCustomers();
  const used = customers
    .map((customer) => Number((customer.cardNumber || '').replace(/\D/g, '')))
    .filter((value) => Number.isFinite(value) && value > 0);
  const max = used.length ? Math.max(...used) : 1041;
  return `HM-${max + 1}`;
}

function toggleCustomerCreation(active) {
  els.customerCreationBox.style.display = active ? 'block' : 'none';
}

async function createCustomerFromForm(event) {
  event.preventDefault();

  const name = normalizeWhitespace(els.customerName.value);
  const phone = normalizeWhitespace(els.customerPhone.value.replace(/\s+/g, ''));

  if (!name || !phone) {
    alert('Veuillez remplir le nom et le WhatsApp du client.');
    return;
  }

  const customers = await readCustomers();
  const duplicate = customers.find((customer) => String(customer.phone || '').replace(/\D/g, '') === phone.replace(/\D/g, ''));
  if (duplicate) {
    state.selectedCustomer = duplicate;
    renderCustomerCard(duplicate);
    els.clientSearch.value = duplicate.cardNumber || duplicate.phone || '';
    toggleCustomerCreation(false);
    return;
  }

  const cardNumber = await buildCustomerNumber();
  const createdCustomer = await createCustomerRecord({
    name,
    firstname: name,
    lastname: '',
    phone,
    cardNumber,
    nb_achats: 0,
    lastSaleAt: null
  });

  if (!createdCustomer) {
    return;
  }

  state.selectedCustomer = createdCustomer;
  renderCustomerCard(createdCustomer);
  els.clientSearch.value = createdCustomer.cardNumber;
  toggleCustomerCreation(false);
  els.clientForm.reset();
}

function openModal() {
  // La classe "hidden" (display:none !important) doit être retirée,
  // sinon elle écrase le style.display appliqué ci-dessous.
  els.quickAddModal.classList.remove('hidden');
  els.quickAddModal.style.display = 'flex';
}

function closeModal() {
  els.quickAddModal.classList.add('hidden');
  els.quickAddModal.style.display = 'none';
}

// Article express : ajoute une ligne libre (nom + prix saisis) UNIQUEMENT au panier
// de la vente en cours, en mémoire (state.cart). Ceci ne doit JAMAIS :
//  - toucher state.products (le catalogue chargé depuis data/products.json),
//  - appeler une fonction d'écriture vers data/products.json ou la table
//    "products" de Supabase,
//  - persister au-delà du panier courant (pas de localStorage/sessionStorage).
// L'article express est nettoyé avec le reste du panier par validateSale()
// et clearCurrentSale() (state.cart = []), donc il ne laisse aucune trace
// dans le catalogue général une fois la vente validée ou réinitialisée.
function addQuickProduct(event) {
  event.preventDefault();
  const name = normalizeWhitespace(els.quickName.value);
  const price = Number(els.quickPrice.value || 0);

  if (!name || !price || price <= 0) {
    alert('Indiquez le nom et le prix de l’article express.');
    return;
  }

  const tempId = `express-${Date.now()}`;
  state.cart.push({
    id: tempId,
    name,
    price,
    quantity: 1,
    source: 'quick',
    isTemporary: true, // marqueur explicite : jamais persisté au catalogue
    catalogId: null    // ne correspond à aucun produit du catalogue
  });
  els.quickAddForm.reset();
  closeModal();
  renderCart();
}

function buildReceiptText(sale) {
  const now = new Date(sale.timestamp);
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
  lines.push(`• Date : ${now.toLocaleString('fr-FR')}`);
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
  lines.push(`TOTAL : ${formatPrice(sale.total)}`);
  lines.push(`Paiement : ${sale.paymentMode}`);
  lines.push('');
  lines.push('PROGRAMME FIDÉLITÉ');
  lines.push(`• Statut carte : Tampon ${sale.loyaltyLevel}/10`);
  if (sale.loyaltyBenefit) {
    lines.push(`• Avantage appliqué : ${sale.loyaltyBenefit}`);
  }
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

function formatClientPhoneForWhatsApp(phone) {
  const digits = normalizeWhitespace(String(phone || '')).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('509')) return digits;
  return `509${digits}`;
}

function openWhatsAppReceipt(sale) {
  const clientPhone = formatClientPhoneForWhatsApp(state.selectedCustomer?.phone || sale.customer?.phone || '');
  const targetPhone = clientPhone || formatClientPhoneForWhatsApp(state.settings.whatsapp || '');
  const receipt = buildReceiptText(sale);
  const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(receipt)}`;

  // Popup compact plutôt qu'un nouvel onglet plein écran : la page de caisse
  // reste visible en arrière-plan. Même nom de fenêtre ("receipt-whatsapp")
  // pour réutiliser la même popup à chaque vente au lieu d'en empiler une nouvelle.
  const popupWidth = 420;
  const popupHeight = 640;
  const left = Math.max(0, (window.screenX || 0) + (window.outerWidth || popupWidth) - popupWidth - 24);
  const top = Math.max(0, (window.screenY || 0) + 60);
  const features = `noopener,width=${popupWidth},height=${popupHeight},left=${left},top=${top}`;

  window.open(url, 'receipt-whatsapp', features);

  // La popup prend le focus à l'ouverture ; on le redonne à la caisse
  // juste après pour que le vendeur puisse enchaîner sans interruption.
  setTimeout(() => {
    window.focus();
  }, 350);
}

async function getReceiptNumber() {
  if (!supabaseClient) return 1;
  const { count, error } = await supabaseClient
    .from('sales')
    .select('id', { count: 'exact', head: true });
  if (error) {
    console.error(error);
    return 1;
  }
  return (count || 0) + 1;
}

async function validateSale() {
  if (!state.selectedCustomer) {
    alert('Sélectionnez un client avant de valider la vente.');
    return;
  }

  if (!state.cart.length) {
    alert('Ajoutez au moins un article au panier.');
    return;
  }

  const seller = normalizeWhitespace(els.sellerSelect.value) || 'Vendeur non défini';
  const paymentMode = normalizeWhitespace(els.paymentMode.value) || 'Cash';
  const total = getCartTotal();
  const customerCountBeforeSale = Number(state.selectedCustomer.nb_achats || 0);
  const customerCountAfterSale = customerCountBeforeSale >= 10 ? 0 : customerCountBeforeSale + 1;
  const loyalty = getLoyaltyStatus(state.selectedCustomer);
  const discountValue = total * loyalty.discount;
  const discountedTotal = total - discountValue;

  const sale = {
    id: `sale-${Date.now()}`,
    receiptNumber: await getReceiptNumber(),
    timestamp: new Date().toISOString(),
    customerId: state.selectedCustomer.id,
    customerName: state.selectedCustomer.name || `${state.selectedCustomer.firstname || ''} ${state.selectedCustomer.lastname || ''}`.trim() || 'Client',
    cardNumber: state.selectedCustomer.cardNumber || 'HM-0000',
    seller,
    paymentMode,
    total: Number(discountedTotal.toFixed(2)),
    originalTotal: Number(total.toFixed(2)),
    discount: Number(discountValue.toFixed(2)),
    items: state.cart.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: Number(item.price || 0),
      total: Number((item.price * item.quantity).toFixed(2))
    })),
    loyaltyLevel: Math.min(customerCountAfterSale, 10),
    loyaltyBenefit: loyalty.benefit || 'Aucun avantage',
    customer: { ...state.selectedCustomer },
    discountRate: Number(loyalty.discount || 0)
  };

  const createdSale = await createSaleRecord(sale);
  if (!createdSale) {
    return;
  }

  const updatedCustomer = await updateCustomerRecord(state.selectedCustomer.id, {
    nb_achats: customerCountAfterSale,
    last_sale_at: sale.timestamp
  });

  state.selectedCustomer = updatedCustomer || state.selectedCustomer;
  renderCustomerCard(state.selectedCustomer);

  openWhatsAppReceipt(createdSale);
  state.cart = [];
  renderCart();
  state.selectedCustomer = null;
  renderCustomerCard(null);
  els.clientSearch.value = '';
  els.sellerSelect.value = '';
  els.paymentMode.value = 'Cash';
  alert('Vente validée et reçu WhatsApp généré.');
  renderReportDashboard();
}

function clearCurrentSale() {
  state.cart = [];
  renderCart();
  state.selectedCustomer = null;
  renderCustomerCard(null);
  els.clientSearch.value = '';
  els.sellerSelect.value = '';
  els.paymentMode.value = 'Cash';
  toggleCustomerCreation(true);
}

async function renderReportDashboard() {
  const range = els.reportRange.value || 'month';
  const search = normalizeWhitespace(els.reportCustomerSearch.value).toLowerCase();
  const sales = await readSales();

  const filtered = sales.filter((sale) => {
    const date = new Date(sale.timestamp);
    const now = new Date();
    const start = new Date(now);

    if (range === 'day') start.setHours(0, 0, 0, 0);
    if (range === 'week') start.setDate(now.getDate() - 6);
    if (range === 'month') start.setMonth(now.getMonth(), 1);

    const matchesRange = date >= start;
    const matchesSearch = !search || `${sale.customerName || ''}`.toLowerCase().includes(search) || `${sale.cardNumber || ''}`.toLowerCase().includes(search);
    return matchesRange && matchesSearch;
  });

  const revenue = filtered.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const average = filtered.length ? revenue / filtered.length : 0;
  const discount = filtered.reduce((sum, sale) => sum + Number(sale.discount || 0), 0);

  els.kpiRevenue.textContent = formatCurrency(revenue);
  els.kpiSalesCount.textContent = String(filtered.length);
  els.kpiAverageTicket.textContent = formatCurrency(average);
  els.kpiDiscountTotal.textContent = formatCurrency(discount);

  if (!filtered.length) {
    els.reportRows.innerHTML = '<tr><td colspan="8" class="muted" style="padding:18px; text-align:center;">Aucune vente pour cette période.</td></tr>';
    return;
  }

  els.reportRows.innerHTML = filtered.map((sale) => `
    <tr>
      <td>${new Date(sale.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</td>
      <td>${sale.customerName || '—'}</td>
      <td>${sale.seller || '—'}</td>
      <td>${sale.paymentMode || '—'}</td>
      <td>${formatCurrency(sale.total || 0)}</td>
      <td>${formatCurrency(sale.discount || 0)}</td>
      <td>${(sale.items || []).map((item) => `${item.quantity}x ${item.name}`).join(', ') || '—'}</td>
      <td><button type="button" class="remove-btn" data-sale-delete-id="${sale.id}">Supprimer</button></td>
    </tr>
  `).join('');

  document.querySelectorAll('[data-sale-delete-id]').forEach((button) => {
    button.addEventListener('click', () => deleteSale(button.dataset.saleDeleteId));
  });
}

async function downloadReportCsv() {
  const rows = await readSales();
  const lines = [
    ['Date', 'Client', 'Carte', 'Vendeur', 'Paiement', 'Total', 'Réduction', 'Articles'].join(',')
  ];

  rows.forEach((sale) => {
    lines.push([
      new Date(sale.timestamp).toISOString(),
      sale.customerName || '',
      sale.cardNumber || '',
      sale.seller || '',
      sale.paymentMode || '',
      Number(sale.total || 0),
      Number(sale.discount || 0),
      (sale.items || []).map((item) => `${item.quantity}x ${item.name}`).join(' | ')
    ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','));
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'rapport-ventes-house-of-meila.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

async function adjustCustomerStampCount(customerId, delta) {
  if (!customerId || !supabaseClient) return;

  const { data: customerData, error: customerError } = await supabaseClient
    .from('customers')
    .select('id, nb_achats')
    .eq('id', customerId)
    .single();

  if (customerError || !customerData) {
    console.error(customerError);
    return;
  }

  const nextCount = Math.max(0, Number(customerData.nb_achats || 0) + Number(delta || 0));

  await supabaseClient
    .from('customers')
    .update({ nb_achats: nextCount })
    .eq('id', customerId);
}

async function deleteSale(saleId) {
  if (!saleId) return;
  const confirmed = window.confirm('Voulez-vous vraiment supprimer cette vente ?');
  if (!confirmed) return;

  if (!supabaseClient) {
    alert('Supabase n\'est pas disponible.');
    return;
  }

  const { data: saleData, error: saleFetchError } = await supabaseClient
    .from('sales')
    .select('id, customer_id')
    .eq('id', saleId)
    .single();

  if (saleFetchError || !saleData) {
    console.error(saleFetchError);
    alert('Impossible de retrouver cette vente.');
    return;
  }

  const { error } = await supabaseClient.from('sales').delete().eq('id', saleId);
  if (error) {
    console.error(error);
    alert('Impossible de supprimer cette vente.');
    return;
  }

  if (saleData.customer_id) {
    await adjustCustomerStampCount(saleData.customer_id, -1);
  }

  await renderReportDashboard();
}

function setupEvents() {
 els.searchClient.addEventListener('click', async () => {
    const found = await searchCustomer(els.clientSearch.value);
    renderCustomerCard(found);
    if (!found) {
      toggleCustomerCreation(true);
    }
  });

  els.clientSearch.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const found = await searchCustomer(els.clientSearch.value);
      renderCustomerCard(found);
      if (!found) {
        toggleCustomerCreation(true);
      }
    }
  });

  els.clientForm.addEventListener('submit', createCustomerFromForm);
  els.productSearch.addEventListener('input', renderProducts);
  els.quickAddProduct.addEventListener('click', openModal);
  els.quickAddForm.addEventListener('submit', addQuickProduct);
  els.closeModal.addEventListener('click', closeModal);
  els.confirmSale.addEventListener('click', validateSale);
  els.resetSale.addEventListener('click', clearCurrentSale);
  els.reportRange.addEventListener('change', renderReportDashboard);
  els.reportCustomerSearch.addEventListener('input', renderReportDashboard);
  els.downloadReport.addEventListener('click', downloadReportCsv);
  els.openCustomerGroupPage.addEventListener('click', () => {
    window.location.href = './customer-sales-report.html';
  });
}

const DELETE_CUSTOMER_PASSWORD = 'house of meila';

async function handleDeleteCustomerClick() {
  if (!state.selectedCustomer) return;

  const password = window.prompt('Mot de passe requis pour supprimer ce client :');

  if (password === null) {
    // Utilisateur a annulé la saisie du mot de passe.
    return;
  }

  if (normalizeWhitespace(password).toLowerCase() !== DELETE_CUSTOMER_PASSWORD) {
    alert('Mot de passe incorrect. Suppression annulée.');
    return;
  }

  const confirmed = window.confirm('Voulez-vous vraiment supprimer définitivement ce client ? Cette action est irréversible.');
  if (!confirmed) {
    return;
  }

  const deleted = await deleteCustomerRecord(state.selectedCustomer.id);
  if (!deleted) return;

  state.selectedCustomer = null;
  els.clientSearch.value = '';
  renderCustomerCard(null);
}

async function deleteCustomerRecord(id) {
  if (!supabaseClient || !id) return false;

  const { error } = await supabaseClient.from('customers').delete().eq('id', id);
  if (error) {
    console.error(error);
    alert('Impossible de supprimer ce client.');
    return false;
  }

  alert('Client supprimé avec succès.');
  return true;
}

async function init() {
  if (!supabaseClient) {
    console.error('Supabase client not initialized. Check the CDN script and keys.');
    alert('Supabase n\'a pas été initialisé. Vérifie la clé et le script CDN du projet.');
    return;
  }

  await loadSettings();
  await loadProducts();
  renderProducts();
  renderCart();
  await renderReportDashboard();
  toggleCustomerCreation(true);
  setupEvents();
}

init();
