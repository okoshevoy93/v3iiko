const clientIdInput = document.getElementById('clientId');
const clientSecretInput = document.getElementById('clientSecret');
const connectBtn = document.getElementById('connectBtn');
const loadCitiesBtn = document.getElementById('loadCitiesBtn');
const loadMenuBtn = document.getElementById('loadMenuBtn');
const integrationSelect = document.getElementById('integrationSelect');
const addIntegrationBtn = document.getElementById('addIntegrationBtn');
const webhookUrlInput = document.getElementById('webhookUrl');
const integrationNameInput = document.getElementById('integrationName');
const saveIntegrationBtn = document.getElementById('saveIntegrationBtn');
const deleteIntegrationBtn = document.getElementById('deleteIntegrationBtn');
const placeSelect = document.getElementById('placeSelect');
const placeSearchInput = document.getElementById('placeSearch');
const placeList = document.getElementById('placeList');
const placeToggle = document.getElementById('placeToggle');
const placeToggleLabel = document.getElementById('placeToggleLabel');
const placePanel = document.getElementById('placePanel');
const placePicker = document.getElementById('placePicker');
const stopListBtn = document.getElementById('stopListBtn');
const iikoKeyInput = document.getElementById('iikoKey');
const statusEl = document.getElementById('status');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const placeCount = document.getElementById('placeCount');
const placeSelectedCount = document.getElementById('placeSelectedCount');
const menuCount = document.getElementById('menuCount');
const menuTableBody = document.getElementById('menuTableBody');
const rawPayload = document.getElementById('rawPayload');
const summaryCategories = document.getElementById('summaryCategories');
const summaryModifiers = document.getElementById('summaryModifiers');
const summaryItems = document.getElementById('summaryItems');
const summaryStop = document.getElementById('summaryStop');
const showStopInlineBtn = document.getElementById('showStopInline');
const exportYandexBtn = document.getElementById('exportYandexBtn');
const currentPlace = document.getElementById('currentPlace');
const manualBaseInput = document.getElementById('manualBase');
const manualTokenPathInput = document.getElementById('manualTokenPath');
const menuTitle = document.getElementById('menuTitle');
const filterCategoryInput = document.getElementById('filterCategory');
const filterNameInput = document.getElementById('filterName');
const filterSkuInput = document.getElementById('filterSku');
const filterDescriptionInput = document.getElementById('filterDescription');
const filterModifiersInput = document.getElementById('filterModifiers');
const filterPriceInput = document.getElementById('filterPrice');
const filterAvailabilityInput = document.getElementById('filterAvailability');
const filterSearchInput = document.getElementById('filterSearch');
const viewPicker = document.getElementById('viewPicker');
const viewToggle = document.getElementById('viewToggle');
const viewToggleLabel = document.getElementById('viewToggleLabel');
const viewPanel = document.getElementById('viewPanel');
const viewOptions = document.getElementById('viewOptions');
const cardsContainer = document.getElementById('cardsContainer');
const menuTable = document.getElementById('menuTable');
const toggleCategoriesBtn = document.getElementById('toggleCategories');
const togglePlacesBtn = document.getElementById('togglePlaces');
const thCategory = document.getElementById('thCategory');
const thName = document.getElementById('thName');
const thPhoto = document.getElementById('thPhoto');
const thSku = document.getElementById('thSku');
const thPrice = document.getElementById('thPrice');
const thAvailability = document.getElementById('thAvailability');
const thDescription = document.getElementById('thDescription');
const thModifiers = document.getElementById('thModifiers');
const filterDescriptionCell = document.getElementById('filterDescriptionCell');
const filterModifiersCell = document.getElementById('filterModifiersCell');
const filterCategoryCell = document.getElementById('filterCategoryCell');
const filterNameCell = document.getElementById('filterNameCell');
const filterPhotoCell = document.getElementById('filterPhotoCell');
const filterSkuCell = document.getElementById('filterSkuCell');
const filterPriceCell = document.getElementById('filterPriceCell');
const filterAvailabilityCell = document.getElementById('filterAvailabilityCell');
const toggleModifiersBtn = document.getElementById('toggleModifiers');
const toggleDescriptionBtn = document.getElementById('toggleDescription');
const stopOverlay = document.getElementById('stopOverlay');
const stopOverlayClose = document.getElementById('stopOverlayClose');
const stopTableBody = document.getElementById('stopTableBody');
const stopSearchInput = document.getElementById('stopSearch');
const expandAllStopBtn = document.getElementById('expandAllStop');
const collapseAllStopBtn = document.getElementById('collapseAllStop');
const stopExportBtn = document.getElementById('stopExportBtn');
const overlay = document.getElementById('dishOverlay');
const overlayClose = document.getElementById('overlayClose');
const overlayTitle = document.getElementById('overlayTitle');
const overlaySku = document.getElementById('overlaySku');
const overlayImage = document.getElementById('overlayImage');
const overlayAvailability = document.getElementById('overlayAvailability');
const overlayPrice = document.getElementById('overlayPrice');
const overlayDescription = document.getElementById('overlayDescription');
const overlayModifiers = document.getElementById('overlayModifiers');
const extraResult = document.getElementById('extraResult');
const orderStatusInput = document.getElementById('orderStatus');
const ordersHistoryPayloadInput = document.getElementById('ordersHistoryPayload');
const historyView = document.getElementById('historyView');
const orderPayloadInput = document.getElementById('orderPayload');
const orderIdInput = document.getElementById('orderIdInput');
const restaurantIdInput = document.getElementById('restaurantIdInput');

const btnAvailability = document.getElementById('btnAvailability');
const btnPromos = document.getElementById('btnPromos');
const btnZones = document.getElementById('btnZones');
const btnSchedule = document.getElementById('btnSchedule');
const btnOrders = document.getElementById('btnOrders');
const btnOrdersHistory = document.getElementById('btnOrdersHistory');
const btnOrderDetails = document.getElementById('btnOrderDetails');
const btnLoadRestaurants = document.getElementById('btnLoadRestaurants');
const btnOrderStatus = document.getElementById('btnOrderStatus');
const btnCreateOrder = document.getElementById('btnCreateOrder');
const btnUpdateOrder = document.getElementById('btnUpdateOrder');
const btnCancelOrder = document.getElementById('btnCancelOrder');
const btnMenuFull = document.getElementById('btnMenuFull');
const selectAllPlacesBtn = document.getElementById('selectAllPlaces');
const clearAllPlacesBtn = document.getElementById('clearAllPlaces');

const SESSION_FLAG_KEY = 'yandexSessionAlive';
const isFreshSession = (() => {
  try {
    const seen = sessionStorage.getItem(SESSION_FLAG_KEY);
    if (!seen) sessionStorage.setItem(SESSION_FLAG_KEY, '1');
    return !seen;
  } catch (e) {
    return false;
  }
})();

let cachedPlaces = [];
let iikoOrgs = [];
let yandexPlaces = [];
let lastMenuPayload = null;
let integrations = [];
let cachedSchedule = new Map();
let storedIikoKey = '';
let normalizedMenuRows = [];
let renderedMenuRows = [];
let allPlaces = [];
let selectedPlaceIds = new Set();
let collapsedPlaces = new Set();
let collapsedCategories = new Set();
const collapsedStopPlaces = new Set();
const collapsedStopCategories = new Set();
let YANDEX_STATE_KEY = 'yandexPageState';
let currentUserName = '';
let showStopItems = false;
let viewMode = 'list';
const availabilityCache = new Map();
let sortField = 'place';
let sortDir = 1;
const columnOrder = ['category', 'name', 'photo', 'sku', 'description', 'modifiers', 'price', 'availability'];
const LEGACY_SALT = 'iiko-enc-v1';
const ENC_SALT = (() => {
  const key = 'iiko-session-salt';
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const rand = crypto.randomUUID ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-');
    const salt = `${rand}-${Date.now()}`;
    sessionStorage.setItem(key, salt);
    return salt;
  } catch (e) {
    console.warn('Session salt unavailable, falling back to legacy', e);
    return `${LEGACY_SALT}-fallback`;
  }
})();
const headerByKey = {
  category: thCategory,
  name: thName,
  photo: thPhoto,
  sku: thSku,
  description: thDescription,
  modifiers: thModifiers,
  price: thPrice,
  availability: thAvailability,
};

function resetMenuState() {
  normalizedMenuRows = [];
  renderedMenuRows = [];
  menuTableBody.innerHTML = '';
  stopTableBody.innerHTML = '';
  rawPayload.textContent = '';
  collapsedPlaces = new Set();
  collapsedCategories = new Set();
  collapsedStopPlaces.clear();
  collapsedStopCategories.clear();
  selectedPlaceIds = new Set();
  placeList.innerHTML = '';
  placeToggleLabel.textContent = 'Выберите точку';
  placeCount.textContent = '0';
  updateSummaryFromRows([]);
  updateCurrentInfo();
}

if (loadCitiesBtn) {
  loadCitiesBtn.dataset.originalLabel = 'Обновить рестораны';
}
const filterCellByKey = {
  category: filterCategoryCell,
  name: filterNameCell,
  photo: filterPhotoCell,
  sku: filterSkuCell,
  description: filterDescriptionCell,
  modifiers: filterModifiersCell,
  price: filterPriceCell,
  availability: filterAvailabilityCell,
};

function stripHtml(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.innerHTML = str;
  return d.textContent || d.innerText || '';
}

async function bootstrapUserKey() {
  try {
    const data = await apiFetch('/api/me');
    currentUserName = data.user || '';
    if (currentUserName) {
      YANDEX_STATE_KEY = `yandexPageState_${currentUserName}`;
    }
  } catch (e) {
    console.warn('Не удалось получить данные пользователя', e);
  }
}

function escapeHtml(str = '') {
  return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
}

function highlightValue(text, needles = [], { rawHtml = false } = {}) {
  const base = rawHtml ? String(text ?? '') : escapeHtml(String(text ?? ''));
  if (!base || !needles.length) return base;
  let result = base;
  needles.filter(Boolean).forEach(term => {
    const safe = escapeHtml(String(term).trim());
    if (!safe) return;
    const pattern = new RegExp(`(${safe.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')})`, 'gi');
    result = result.replace(pattern, '<span class="highlight">$1</span>');
  });
  return result;
}

const VIEW_OPTIONS = [
  { value: 'list', label: 'Список' },
  { value: 'cards', label: 'Карточки' },
];

function syncViewPickerLabel() {
  if (viewToggleLabel) viewToggleLabel.textContent = viewMode === 'cards' ? 'Карточки' : 'Список';
}

function renderViewOptions() {
  if (!viewOptions) return;
  viewOptions.innerHTML = '';
  VIEW_OPTIONS.forEach(opt => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `picker-item ${viewMode === opt.value ? 'selected' : ''}`;
    btn.innerHTML = `<span class="title">${opt.label}</span>`;
    btn.addEventListener('click', () => setViewMode(opt.value));
    viewOptions.appendChild(btn);
  });
  syncViewPickerLabel();
}

function setViewMode(mode) {
  if (!VIEW_OPTIONS.find(o => o.value === mode)) mode = 'list';
  viewMode = mode;
  syncViewPickerLabel();
  if (viewPicker) viewPicker.classList.remove('open');
  renderViewOptions();
  applyMenuFilters();
  persistSession();
}

function encodeSecret(str = '') {
  try {
    const salted = Array.from(str).map((ch, idx) => String.fromCharCode(ch.charCodeAt(0) ^ ENC_SALT.charCodeAt(idx % ENC_SALT.length))).join('');
    return btoa(salted);
  } catch (e) {
    return str;
  }
}

function decodeSecret(str = '') {
  try {
    const decoded = atob(str);
    const withPrimary = Array.from(decoded).map((ch, idx) => String.fromCharCode(ch.charCodeAt(0) ^ ENC_SALT.charCodeAt(idx % ENC_SALT.length))).join('');
    if (withPrimary) return withPrimary;
  } catch (e) {
    // ignore and try legacy
  }
  try {
    const decoded = atob(str);
    return Array.from(decoded).map((ch, idx) => String.fromCharCode(ch.charCodeAt(0) ^ LEGACY_SALT.charCodeAt(idx % LEGACY_SALT.length))).join('');
  } catch (e2) {
    return str;
  }
}

function formatPrice(val) {
  if (val === null || val === undefined || val === '') return '';
  const clean = String(val).replace(/₽/g, '').replace(/\s+/g, '').trim();
  if (!clean) return '';
  const num = Number(clean);
  if (!Number.isNaN(num)) {
    return `${num.toLocaleString('ru-RU')} ₽`;
  }
  return `${clean} ₽`;
}
let showModifiers = true;
let showDescription = false;
let restoredSession = false;
let restorePlaceId = '';

function getVisibleColumns() {
  return columnOrder.filter(key => {
    if (key === 'availability' && viewMode === 'list') return false;
    if (key === 'description') return showDescription;
    if (key === 'modifiers') return showModifiers;
    return true;
  });
}

function syncColumnVisibility() {
  const visible = new Set(getVisibleColumns());
  columnOrder.forEach(key => {
    const isVisible = visible.has(key);
    headerByKey[key]?.classList.toggle('hidden', !isVisible);
    filterCellByKey[key]?.classList.toggle('hidden', !isVisible);
  });
}

if (!isFreshSession) {
  try {
    const rawKey = localStorage.getItem('iikoApiLogin') || '';
    storedIikoKey = decodeSecret(rawKey) || rawKey || '';
  } catch (e) {
    console.warn('localStorage unavailable', e);
  }
}

function syncStoredIikoKey(value) {
  storedIikoKey = value || storedIikoKey || '';
  try {
    if (storedIikoKey) localStorage.setItem('iikoApiLogin', encodeSecret(storedIikoKey));
  } catch (e) {
    console.warn('localStorage unavailable', e);
  }
}

function setStatus(message, tone = 'info') {
  statusEl.textContent = message;
  statusEl.className = `text-sm px-3 py-2 rounded-lg border ${tone === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : tone === 'err' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-slate-100 border-slate-200 text-slate-700'}`;
  if (statusDot) {
    statusDot.classList.toggle('ok', tone === 'ok');
    statusDot.classList.toggle('err', tone === 'err');
  }
  if (statusText) statusText.textContent = tone === 'ok' ? '' : tone === 'err' ? 'Ошибка' : '';
}

function buttonLoading(btn, isLoading, label) {
  if (!btn) return;
  if (!btn.dataset.originalLabel) btn.dataset.originalLabel = btn.textContent || 'Обновить рестораны';
  btn.disabled = isLoading;
  if (isLoading) {
    btn.textContent = label || 'Загрузка...';
    btn.classList.add('opacity-70', 'cursor-wait');
  } else {
    btn.textContent = btn.dataset.originalLabel || btn.textContent;
    btn.classList.remove('opacity-70', 'cursor-wait');
  }
}

function getCreds() {
  const client_id = clientIdInput.value.trim();
  const client_secret = clientSecretInput.value.trim();
  const webhook_url = getWebhookUrl();
  if (!client_id || !client_secret) {
    setStatus('Укажите client_id и client_secret.', 'err');
    return null;
  }
  if (!webhook_url) {
    setStatus('Укажите URL вебхука (baseUrl интеграции).', 'err');
    return null;
  }
  return { client_id, client_secret, webhook_url };
}

function getWebhookUrl() {
  return webhookUrlInput.value.trim();
}

function getOverrides() {
  const manual_base = manualBaseInput?.value?.trim();
  const manual_token_path = manualTokenPathInput?.value?.trim();
  return { manual_base, manual_token_path };
}

function getSelectedPlaceIds() {
  if (selectedPlaceIds.size) return Array.from(selectedPlaceIds);
  const option = placeSelect?.options?.[placeSelect.selectedIndex];
  const selected = option?.dataset?.placeId || option?.value || '';
  return selected ? [selected] : [];
}

function getActivePlaceId() {
  const option = placeSelect?.options?.[placeSelect.selectedIndex];
  const selected = option?.dataset?.placeId;
  if (selected) return selected;
  const manual = placeIdManual?.value?.trim();
  if (manual) return manual;
  const fallback = option?.value?.trim();
  return fallback || '';
}

function getPlaceMeta(placeId) {
  const place = allPlaces.find(p => (p.placeId || p.id || p.restaurant_id || p.code) === placeId) || {};
  return {
    placeId,
    placeName: place.name || place.title || place.label || '',
  };
}

function getRestaurantId() {
  const manual = restaurantIdInput?.value?.trim();
  if (manual) return manual;
  return getActivePlaceId();
}

async function apiFetch(url, options = {}) {
  const resp = await fetch(url, options);
  let data = {};
  try {
    data = await resp.json();
  } catch (e) {
    const text = await resp.text().catch(() => '');
    if (text) data = { error: text.slice(0, 500) };
  }
  if (!resp.ok) {
    throw new Error(data.error || `Ошибка запроса (${resp.status})`);
  }
  return data;
}

async function callYandex(path, { method = 'GET', params = {}, body = null } = {}) {
  const creds = getCreds();
  if (!creds) return null;
  const overrides = getOverrides();
  const url = new URL(path, window.location.origin);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (method !== 'GET' && body) options.body = JSON.stringify({ ...creds, ...overrides, ...body });
  if (method === 'GET') {
    url.searchParams.set('client_id', creds.client_id);
    url.searchParams.set('client_secret', creds.client_secret);
    url.searchParams.set('webhook_url', creds.webhook_url);
    if (overrides.manual_base) url.searchParams.set('manual_base', overrides.manual_base);
    if (overrides.manual_token_path) url.searchParams.set('manual_token_path', overrides.manual_token_path);
  }
  if (method !== 'GET' && !options.body) {
    options.body = JSON.stringify({ ...creds, ...overrides, ...(body || {}) });
  }
  return apiFetch(url.toString(), options);
}

function renderExtraResult(title, data, { preserveHistory = false } = {}) {
  if (!extraResult) return;
  if (!preserveHistory && historyView) historyView.classList.add('hidden');
  const pretty = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  extraResult.textContent = `${title}\n${pretty}`;
}

function renderHistory(data, title = 'История') {
  if (!historyView) return renderExtraResult(title, data);
  const orders = Array.isArray(data?.orders) ? data.orders : Array.isArray(data?.items) ? data.items : data?.result?.orders || [];
  if (!orders.length) {
    historyView.classList.add('hidden');
    return renderExtraResult(title, data);
  }
  historyView.innerHTML = '';
  orders.forEach(order => {
    const number = order.number || order.id || order.order_id || '—';
    const created = order.created_at || order.createdAt || order.created || order.date || '';
    const cooking = order.cooking_started_at || order.cookingStart || order.cooking_start || '';
    const ready = order.ready_at || order.readyTime || order.ready_time || order.ready || '';
    const handed = order.handover_time || order.handed_at || order.delivered_at || '';
    const items = Array.isArray(order.items)
      ? order.items.map(i => `${i.name || i.title || 'Позиция'} — ${i.quantity || i.qty || 1} шт. × ${(i.price || i.cost || '')}`).join('<br>')
      : '—';
    const total = order.total_price || order.totalPrice || order.summary || order.amount || '';
    const block = document.createElement('div');
    block.className = 'border border-slate-200 rounded-lg p-2 bg-white';
    block.innerHTML = `
      <div class="text-sm font-semibold">Заказ ${number}</div>
      <div class="text-xs text-slate-600">Создан: ${created || '—'}</div>
      <div class="text-xs text-slate-600">Готовка: ${cooking || '—'}</div>
      <div class="text-xs text-slate-600">Готов: ${ready || '—'}</div>
      <div class="text-xs text-slate-600">Выдан / доставлен: ${handed || '—'}</div>
      <div class="text-xs text-slate-600">Состав:<br>${items}</div>
      <div class="text-xs text-slate-700 font-semibold mt-1">Сумма: ${total || '—'}</div>
    `;
    historyView.appendChild(block);
  });
  historyView.classList.remove('hidden');
  renderExtraResult(title, data, { preserveHistory: true });
}

async function verifyAccess() {
  const creds = getCreds();
  if (!creds) return;
  buttonLoading(connectBtn, true, 'Проверяем...');
  try {
    const data = await apiFetch('/api/yandex/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...creds, webhook_url: getWebhookUrl() }),
    });
    if (data.token) {
      setStatus('Доступ подтверждён. Загружаем рестораны...', 'ok');
      await runRestaurants();
    } else {
      setStatus('Не удалось получить токен. Проверьте данные.', 'err');
    }
  } catch (e) {
    const msg = e.message || 'Ошибка запроса к Yandex Еде';
    if (msg.toLowerCase().includes('connection refused')) {
      setStatus('Host недоступен. Проверьте URL, firewall или VPN. Из PDF: разблокируйте логины в транспорте iiko.', 'err');
    } else if (msg.toLowerCase().includes('заблокированы')) {
      setStatus('API логины заблокированы. Разблокируйте их в iiko транспорт и повторите.', 'err');
    } else {
      setStatus(msg, 'err');
    }
  } finally {
    buttonLoading(connectBtn, false);
  }
}

function normalizePlaces(payload) {
  if (!payload) return [];
  if (Array.isArray(payload.places)) return payload.places;
  if (Array.isArray(payload.items)) return payload.items;
  if (payload.result && Array.isArray(payload.result.places)) return payload.result.places;
  return [];
}

function normalizeKey(str) {
  return (str || '').toString().toLowerCase().replace(/ё/g, 'е').replace(/[^a-z0-9а-я]/g, '');
}

function findYandexPlace(org) {
  const orgName = normalizeKey(org.name || org.fullName || org.title || org.organizationName || '');
  const orgCity = normalizeKey(org.city || org.address?.city || org.region?.city || '');
  return yandexPlaces.find(p => {
    const pName = normalizeKey(p.name || p.title || p.slug || '');
    const pCity = normalizeKey(p.city || p.cityName || p.city_id || '');
    return pName && orgName && pName.includes(orgName.slice(0, Math.max(4, orgName.length - 2))) && (!orgCity || pCity === orgCity || pCity.includes(orgCity));
  }) || null;
}


function renderPlaces(places, preserveSource = false) {
  if (!preserveSource) allPlaces = places;
  cachedPlaces = places;
  placeSelect.innerHTML = '';
  placeList.innerHTML = '';
  let maxLabelLen = 0;
  places.forEach(place => {
    const placeId = place.orgId || place.yandexPlaceId || place.id || place.place_id || '';
    const name = place.name || place.title || place.slug || 'Без названия';
    const titleWithId = `${name}${placeId ? ` · ${placeId}` : ''}`;
    maxLabelLen = Math.max(maxLabelLen, titleWithId.length);
    const option = document.createElement('option');
    option.value = placeId;
    option.textContent = name;
    option.dataset.address = place.address || place.full_address || place.location || place.address_full || '';
    option.dataset.orgId = place.orgId || place.organizationId || '';
    option.dataset.placeId = placeId;
    option.dataset.schedule = JSON.stringify(place.schedule || place.work_time || {});
    if (selectedPlaceIds.has(placeId)) option.selected = true;
    placeSelect.appendChild(option);

    const btn = document.createElement('button');
    const selected = selectedPlaceIds.has(placeId);
    btn.type = 'button';
    btn.className = `picker-item ${selected ? 'selected' : ''}`;
    btn.dataset.placeId = placeId;
    btn.dataset.address = option.dataset.address;
    btn.innerHTML = `<div class="flex flex-col">` +
      `<span class="title flex flex-wrap items-center gap-1">${name}${placeId ? `<span class="pill-id">· ${placeId}</span>` : ''}</span>` +
      `<span class="meta">${option.dataset.address || 'Адрес не указан'}</span>` +
      `</div>`;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlaceSelection(placeId);
    });
    placeList.appendChild(btn);
  });
  if (restorePlaceId) {
    if (!selectedPlaceIds.size) selectedPlaceIds = new Set([restorePlaceId]);
  }
  placeCount.textContent = places.length;
  if (placeSelectedCount) placeSelectedCount.textContent = selectedPlaceIds.size;
  if (placePicker && maxLabelLen) {
    const widthPx = Math.min(Math.max(maxLabelLen * 8, 240), 520);
    placePicker.style.minWidth = `${widthPx}px`;
    placePicker.style.maxWidth = `${widthPx}px`;
  }
  updateCurrentInfo();
}

function togglePlaceSelection(placeId) {
  if (!placeId) return;
  if (selectedPlaceIds.has(placeId)) {
    selectedPlaceIds.delete(placeId);
  } else {
    selectedPlaceIds.add(placeId);
  }
  Array.from(placeSelect.options).forEach(opt => {
    opt.selected = selectedPlaceIds.has(opt.value);
  });
  renderPlaces(allPlaces, true);
  const picker = document.getElementById('placePicker');
  picker?.classList.add('open');
  persistSession();
}

function selectAllPlaces() {
  selectedPlaceIds = new Set((cachedPlaces || []).map(p => p.orgId || p.yandexPlaceId || p.id || p.place_id || '').filter(Boolean));
  Array.from(placeSelect.options).forEach(opt => { opt.selected = selectedPlaceIds.has(opt.value); });
  renderPlaces(allPlaces, true);
  persistSession();
}

function clearAllPlaces() {
  selectedPlaceIds.clear();
  Array.from(placeSelect.options).forEach(opt => { opt.selected = false; });
  renderPlaces(allPlaces, true);
  persistSession();
}

function parsePrice(item) {
  const price = item.price?.value ?? item.price?.amount ?? item.price ?? item.cost ?? item.current_price;
  if (typeof price === 'number') return `${price.toFixed(2)} ₽`;
  if (price && price.amount) return `${price.amount} ₽`;
  return '';
}

function parseQuantity(item) {
  const qty = item.balance ?? item.quantity ?? item.count ?? item.available_amount ?? item.stock;
  if (typeof qty === 'number') return qty;
  return '';
}

function parseModifiers(item) {
  const mods = item.modifiers || item.availableModifiers || item.allowedModifiers || item.options || [];
  const list = Array.isArray(mods) ? mods : (Array.isArray(mods.items) ? mods.items : []);
  return list.map(m => ({
    id: m.id || m.sku || m.code || '',
    name: m.name || m.title || m.public_name || '',
    price: parsePrice(m),
    min: m.minAmount ?? m.min ?? 0,
    max: m.maxAmount ?? m.max ?? 0,
  }));
}

function extractModifierGroups(item) {
  const groups = item.modifierGroups || item.modifiersGroups || item.groupModifiers || [];
  if (!Array.isArray(groups)) return [];
  return groups.map(g => {
    const mods = Array.isArray(g.modifiers) ? g.modifiers : [];
    return {
      name: g.name || 'Группа модификаторов',
      min: g.minSelectedModifiers ?? g.minSelected ?? g.min ?? 0,
      max: g.maxSelectedModifiers ?? g.maxSelected ?? g.max ?? mods.length,
      required: (g.minSelectedModifiers ?? g.min ?? 0) > 0,
      modifiers: mods.map(m => ({
        id: m.id || m.sku || m.code || '',
        name: m.name || m.title || '',
        price: parsePrice(m),
        min: m.minAmount ?? m.min ?? 0,
        max: m.maxAmount ?? m.max ?? 0,
      })),
    };
  });
}

function extractImage(item) {
  const imgs = item.images || item.image || [];
  if (Array.isArray(imgs) && imgs.length) return imgs[0].url || imgs[0].path || imgs[0];
  if (imgs.url) return imgs.url;
  return '';
}

function buildCategoryMap(menu) {
  const map = new Map();
  const categories = menu?.categories || menu?.groups || [];
  categories.forEach(cat => {
    const id = cat.id || cat.category_id || cat.group_id;
    if (!id) return;
    map.set(id, cat.name || cat.title || cat.public_name || 'Без категории');
  });
  return map;
}

function buildAvailabilityMap(data) {
  const map = new Map();
  if (!data) return map;
  const items = Array.isArray(data)
    ? data
    : (Array.isArray(data.items)
      ? data.items
      : Array.isArray(data.products)
        ? data.products
        : Array.isArray(data.result?.items)
          ? data.result.items
          : []);
  items.forEach(entry => {
    const id = entry.id
      || entry.item_id
      || entry.itemId
      || entry.product_id
      || entry.productId
      || entry.sku
      || entry.code;
    if (!id) return;
    const rawStatus = entry.status || entry.state;
    const quantityRaw = entry.balance ?? entry.quantity ?? entry.count ?? entry.stock;
    const quantity = typeof quantityRaw === 'number' ? quantityRaw : null;
    let available = entry.available ?? entry.is_available ?? entry.in_stock ?? (rawStatus === 'available' ? true : rawStatus === 'unavailable' ? false : undefined);
    if (available === undefined && quantity !== null) available = quantity > 0;
    const date = entry.date || entry.updated_at || entry.updatedAt || entry.timestamp || entry.not_available_from || entry.notAvailableFrom;
    const title = entry.name || entry.title || entry.itemName || entry.product_name || entry.productName;
    const category = entry.category || entry.group || entry.parent_group_name || entry.groupName || entry.categoryName;
    const image = extractImage(entry) || (entry.photo_url || entry.photoUrl || '');
    map.set(id, { available, quantity, date, stock: entry.stock, name: title, category, image, price: parsePrice(entry) });
  });
  return map;
}

function applyAvailabilityToRows(placeId, availabilityMap) {
  if (!availabilityMap || !availabilityMap.size || !normalizedMenuRows.length) return;
  normalizedMenuRows = normalizedMenuRows.map(row => {
    if (placeId && row.placeId && row.placeId !== placeId) return row;
    const availability = availabilityMap.get(row.id);
    if (!availability) return row;
    const stop = availability.available === false;
    return {
      ...row,
      stopList: stop || row.stopList,
      available: availability.available ?? row.available,
      stopDate: availability.date || row.stopDate,
      quantity: availability.quantity ?? row.quantity
    };
  });
}

function normalizeMenuItems(menuName, menuData, availabilityMap, meta = {}) {
  const items = menuData?.items || menuData?.products || menuData?.menu_items || [];
  const categories = buildCategoryMap(menuData);
  const modifiersPool = menuData?.modifiers || menuData?.groupModifiers || [];
  const modifierCount = Array.isArray(modifiersPool) ? modifiersPool.length : 0;

  const mapped = (items || []).map(item => {
    const categoryId = item.category_id || item.group_id || item.categoryId || item.groupId || item.parent_group;
    const categoryName = categories.get(categoryId) || item.category || 'Без категории';
    const modifiers = parseModifiers(item);
    const modifierGroups = extractModifierGroups(item);
    const availability = availabilityMap?.get(item.id || item.sku || item.code || item.item_id || item.product_id || '') || {};
    const availabilityFlag = availability.available;
    const qtyOverride = availability.quantity;
    return {
      menu: menuName,
      category: categoryName,
      name: item.name || item.public_name || item.title || 'Без названия',
      id: item.id || item.sku || item.code || item.item_id || '',
      price: parsePrice(item),
      quantity: qtyOverride ?? parseQuantity(item),
      available: availabilityFlag ?? (item.available ?? item.is_available ?? item.in_stock ?? true),
      stopList: availabilityFlag === false || item.available === false || item.is_available === false || item.in_stock === false,
      stopDate: availability?.date || '',
      modifiers,
      modifierGroups,
      modifierCount,
      image: extractImage(item),
      description: item.description || item.composition || '',
      place: meta.placeName || '',
      placeId: meta.placeId || '',
      raw: item,
    };
  });

  return mapped;
}

function collectMenus(payload) {
  const menus = [];
  if (!payload) return menus;
  if (Array.isArray(payload.menus)) {
    payload.menus.forEach(m => menus.push({ name: m.name || m.title || 'Меню', data: m.menu || m }));
  } else if (payload.menu) {
    menus.push({ name: payload.name || payload.menu?.name || 'Меню', data: payload.menu });
  } else if (payload.items || payload.products) {
    menus.push({ name: payload.name || 'Меню', data: payload });
  }
  return menus;
}

function filterPlaces(query) {
  const q = (query || '').toLowerCase();
  const source = allPlaces.length ? allPlaces : cachedPlaces;
  const filtered = q
    ? source.filter(p => {
      const name = (p.name || p.title || '').toLowerCase();
      const addr = (p.address || p.full_address || p.location || '').toLowerCase();
      const pid = (p.orgId || p.id || p.yandexPlaceId || '').toLowerCase();
      return name.includes(q) || addr.includes(q) || pid.includes(q);
    })
    : source;
  renderPlaces(filtered, true);
  updateCurrentInfo();
}

function renderIntegrations(list) {
  integrations = list || [];
  integrationSelect.innerHTML = '<option value="">— Не выбрано —</option>';
  integrations.forEach(item => {
    const option = document.createElement('option');
    option.value = item.name;
    option.textContent = item.name;
    integrationSelect.appendChild(option);
  });
}

function applyIntegration(name) {
  const found = integrations.find(i => i.name === name);
  if (!found) return;
  resetMenuState();
  webhookUrlInput.value = found.webhook_url || '';
  clientIdInput.value = found.client_id || '';
  clientSecretInput.value = found.client_secret || '';
  integrationNameInput.value = found.name;
  const iikoKey = found.iiko_key || storedIikoKey || '';
  if (iikoKeyInput) iikoKeyInput.value = iikoKey;
  syncStoredIikoKey(iikoKey);
  setStatus(`Интеграция «${found.name}» подставлена. Нажмите «Проверить доступ» и обновите города.`, 'info');
  loadCities();
}

function startNewIntegration() {
  resetMenuState();
  integrationSelect.value = '';
  integrationNameInput.value = '';
  webhookUrlInput.value = '';
  clientIdInput.value = '';
  clientSecretInput.value = '';
  manualBaseInput.value = '';
  manualTokenPathInput.value = '';
  if (iikoKeyInput) iikoKeyInput.value = '';
  setStatus('Введите данные новой интеграции и сохраните.', 'info');
}

function renderMenuAggregate(entries = []) {
  normalizedMenuRows = [];
  let totalItems = 0;
  let totalModifiers = 0;
  let totalStops = 0;
  const categorySet = new Set();
  entries.forEach(entry => {
    const { payload, availabilityMap, meta, placeId } = entry;
    lastMenuPayload = payload;
    const menus = collectMenus(payload);
    menus.forEach(menu => {
      const rows = normalizeMenuItems(menu.name, menu.data || {}, availabilityMap, meta);
      if (availabilityMap?.size) {
        availabilityCache.set(placeId || meta?.placeId, availabilityMap);
        applyAvailabilityToRows(placeId || meta?.placeId, availabilityMap);
      }
      normalizedMenuRows.push(...rows);
      rows.forEach(row => {
        categorySet.add(row.category);
        totalModifiers += (row.modifiers?.length || 0) + (row.modifierGroups?.length || 0);
        if (row.stopList) totalStops += 1;
      });
      totalItems += rows.length;
    });
  });

  rawPayload.textContent = JSON.stringify(entries.map(e => e.payload) || {}, null, 2);
  renderMenuView(normalizedMenuRows);
  if ((filterCategoryInput?.value || filterNameInput?.value || filterSkuInput?.value || filterDescriptionInput?.value || filterModifiersInput?.value || filterPriceInput?.value || filterAvailabilityInput?.value || filterSearchInput?.value)) {
    applyMenuFilters();
  }
}

function updateSummaryFromRows(currentRows = null) {
  if (!summaryItems || !summaryCategories || !summaryModifiers || !summaryStop) return;
  const source = currentRows || renderedMenuRows || normalizedMenuRows || [];
  const categories = new Set();
  let modifiers = 0;
  let stops = 0;
  source.forEach(row => {
    if (row.category) categories.add(row.category);
    modifiers += (row.modifierGroups?.length || 0) + (row.modifiers?.length || 0);
    if (row.stopList) stops += 1;
  });
  const totalItems = source.length;
  if (menuCount) menuCount.textContent = totalItems || '';
  summaryItems.textContent = totalItems ? `Блюд: ${totalItems}` : 'Блюд:';
  summaryCategories.textContent = categories.size ? `Категории: ${categories.size}` : 'Категории:';
  summaryModifiers.textContent = modifiers ? `Модификаторы: ${modifiers}` : 'Модификаторы:';
  summaryStop.textContent = stops ? `Стоп-лист: ${stops}` : 'Стоп-лист';
  summaryStop.dataset.count = stops || '';
  toggleModifiersBtn.textContent = showModifiers ? 'Модификаторы −' : 'Модификаторы +';
  toggleDescriptionBtn.textContent = showDescription ? 'Скрыть описание' : 'Показать описание';
  showStopInlineBtn.textContent = showStopItems ? 'Скрыть стоп-лист' : 'Показать стоп-лист';
}

function applyMenuFilters() {
  const cat = (filterCategoryInput?.value || '').toLowerCase();
  const name = (filterNameInput?.value || '').toLowerCase();
  const sku = (filterSkuInput?.value || '').toLowerCase();
  const desc = (filterDescriptionInput?.value || '').toLowerCase();
  const mods = (filterModifiersInput?.value || '').toLowerCase();
  const price = (filterPriceInput?.value || '').toLowerCase();
  const avail = (filterAvailabilityInput?.value || '').toLowerCase();
  const search = (filterSearchInput?.value || '').toLowerCase();
  const filtered = normalizedMenuRows.filter(row => {
    const modText = stripHtml(buildModifiersHtml(row)).toLowerCase();
    const availabilityText = row.stopList ? 'в стопе' : (row.available ? 'доступно' : 'недоступно');
    const byCat = !cat || (row.category || '').toLowerCase().includes(cat);
    const byName = !name || (row.name || '').toLowerCase().includes(name);
    const bySku = !sku || (row.id || '').toLowerCase().includes(sku);
    const byDesc = !desc || (row.description || '').toLowerCase().includes(desc);
    const byMods = !mods || modText.includes(mods);
    const byPrice = !price || String(row.price || '').toLowerCase().includes(price);
    const byAvail = !avail || availabilityText.includes(avail);
    const bySearch = !search || [row.name, row.id, row.category, modText].some(v => (v || '').toLowerCase().includes(search));
    return byCat && byName && bySku && byDesc && byMods && byPrice && byAvail && bySearch;
  });
  const highlights = {
    category: cat ? [cat] : [],
    name: name ? [name] : [],
    sku: sku ? [sku] : [],
    description: desc ? [desc] : [],
    modifiers: mods ? [mods] : [],
    price: price ? [price] : [],
    availability: avail ? [avail] : [],
    search: search ? [search] : [],
  };
  renderMenuView(filtered, highlights);
}

function prepareMenuData(rows) {
  let data = (rows || []).filter(r => showStopItems || !r.stopList);
  if (sortField) {
    data = [...data].sort((a, b) => {
      const av = (a[sortField] || '').toString().toLowerCase();
      const bv = (b[sortField] || '').toString().toLowerCase();
      if (av < bv) return -1 * sortDir;
      if (av > bv) return 1 * sortDir;
      return 0;
    });
  }
  renderedMenuRows = data;
  return data;
}

function renderMenuTable(rows, highlights = {}, prepared = false) {
  if (!menuTableBody) return;
  syncColumnVisibility();
  const visibleColumns = getVisibleColumns();
  const colCount = visibleColumns.length;
  const data = prepared ? (rows || []) : prepareMenuData(rows);
  menuTableBody.innerHTML = '';
  const placeGroups = new Map();
  data.forEach(row => {
    const key = row.place || 'Без точки';
    if (!placeGroups.has(key)) placeGroups.set(key, []);
    placeGroups.get(key).push(row);
  });

  placeGroups.forEach((itemsForPlace, placeName) => {
    const placeCollapsed = collapsedPlaces.has(placeName);
    const placeHeader = document.createElement('tr');
    const placeClass = `place-${normalizeKey(placeName)}`;
    placeHeader.className = 'group-city-row cursor-pointer';
    placeHeader.dataset.toggle = placeClass;
    placeHeader.dataset.place = placeName;
    placeHeader.innerHTML = `<th colspan="${colCount}" class="px-3 py-2 text-[12px] font-semibold border-t border-b border-slate-200"><div class="flex items-center gap-3 justify-start"><span class="group-toggle">${placeCollapsed ? '+' : '−'}</span><span class="font-semibold">${placeName}</span><span class="text-slate-500">(${itemsForPlace.length})</span></div></th>`;
    menuTableBody.appendChild(placeHeader);

    if (placeCollapsed) return;

    const grouped = new Map();
    itemsForPlace.forEach(row => {
      if (!grouped.has(row.category)) grouped.set(row.category, []);
      grouped.get(row.category).push(row);
    });

    grouped.forEach((items, category) => {
      const catId = `cat-${normalizeKey(category)}-${normalizeKey(placeName)}`;
      const catCollapsed = collapsedCategories.has(catId);
      const header = document.createElement('tr');
      header.className = 'group-category-row cursor-pointer';
      header.dataset.toggle = catId;
      header.dataset.category = catId;
      header.innerHTML = `<th colspan="${colCount}" class="px-3 py-2 text-[12px] font-semibold text-slate-800 text-left border-t border-b border-slate-200"><div class="flex items-center gap-3 justify-start"><span class="group-toggle">${catCollapsed ? '+' : '−'}</span>
        <span class="flex flex-col leading-tight">${category || 'Без категории'}</span>
        <span class="text-xs text-slate-500">${items.length} поз.</span></div>
      </th>`;
      menuTableBody.appendChild(header);

      if (catCollapsed) return;

      items.forEach(row => {
        const imageSrc = row.image ? `/img?url=${encodeURIComponent(row.image)}&thumb=1` : '';
        const availabilityBadge = row.stopList ? '<span class="photo-badge red">В стопе</span>' : (row.available ? '<span class="photo-badge green">Доступно</span>' : '<span class="photo-badge red">Нет</span>');
        const imageHtml = `<div class="photo-wrap">${imageSrc
          ? `<img src="${imageSrc}" data-full="/img?url=${encodeURIComponent(row.image)}" alt="${row.name}" class="menu-img" loading="lazy" decoding="async" />`
          : `<div class="menu-img placeholder">нет фото</div>`}${availabilityBadge}</div>`;
        const modifiersHtml = buildModifiersHtml(row);
        const tr = document.createElement('tr');
        tr.className = `menu-data-row hover:bg-slate-50 ${row.stopList ? 'bg-rose-50/60' : ''} ${catId} ${placeClass} border-b border-slate-200`;
        tr.dataset.category = catId;
        const cells = [];
        const catNeedles = [...(highlights.category || []), ...(highlights.search || [])];
        const nameNeedles = [...(highlights.name || []), ...(highlights.search || [])];
        const skuNeedles = [...(highlights.sku || []), ...(highlights.search || [])];
        const descNeedles = [...(highlights.description || []), ...(highlights.search || [])];
        const modNeedles = [...(highlights.modifiers || []), ...(highlights.search || [])];
        visibleColumns.forEach(col => {
          if (col === 'category') cells.push(`<td class="px-3 py-2 text-slate-800 font-semibold text-left align-middle col-category">${highlightValue(row.category || 'Без категории', catNeedles)}</td>`);
          if (col === 'name') cells.push(`<td class="px-3 py-2 align-middle col-name"><div class="flex items-center gap-2 justify-start text-left min-h-[52px] leading-tight">${highlightValue(row.name || '', nameNeedles)}</div></td>`);
          if (col === 'photo') cells.push(`<td class="px-3 py-2 text-center align-middle col-photo"><div class="flex items-center justify-center">${imageHtml}</div></td>`);
          if (col === 'sku') cells.push(`<td class="px-3 py-2 text-sm font-semibold text-slate-800 text-center align-middle col-sku">${highlightValue(row.id || '—', skuNeedles)}</td>`);
          if (col === 'description') cells.push(`<td class="px-3 py-2 text-xs text-slate-600 text-left align-middle col-description">${highlightValue(row.description || '', descNeedles)}</td>`);
          if (col === 'modifiers') cells.push(`<td class="px-3 py-2 text-xs text-slate-600 text-left align-middle col-modifiers">${highlightValue(modifiersHtml, modNeedles, { rawHtml: true })}</td>`);
          if (col === 'price') cells.push(`<td class="px-3 py-2 text-center align-middle col-price price-strong">${formatPrice(row.price)}</td>`);
          if (col === 'availability') cells.push(`<td class="px-3 py-2 text-center align-middle col-availability">${row.stopList ? '<span class="pill red">Стоп</span>' : (row.available ? '<span class="pill green">Доступно</span>' : '<span class="pill red">Нет</span>')}</td>`);
        });
        tr.innerHTML = cells.join('');
        tr.dataset.itemId = row.id;
        tr.dataset.itemIndex = normalizedMenuRows.indexOf(row);
        menuTableBody.appendChild(tr);
      });
    });
  });
}

function renderMenuCards(rows, highlights = {}, prepared = false) {
  if (!cardsContainer) return;
  const data = prepared ? (rows || []) : prepareMenuData(rows);
  cardsContainer.innerHTML = '';
  const placeGroups = new Map();
  data.forEach(row => {
    const key = row.place || 'Без точки';
    if (!placeGroups.has(key)) placeGroups.set(key, []);
    placeGroups.get(key).push(row);
  });
  placeGroups.forEach((itemsForPlace, placeName) => {
    const placeCollapsed = collapsedPlaces.has(placeName);
    const placeWrap = document.createElement('div');
    placeWrap.className = 'mb-3';
    placeWrap.innerHTML = `<div class="group-city-row cursor-pointer px-3 py-2 text-[12px] font-semibold border border-slate-200 rounded-lg bg-slate-50 flex items-center gap-3" data-toggle="${normalizeKey(placeName)}" data-place="${placeName}"><span class="group-toggle">${placeCollapsed ? '+' : '−'}</span><span class="font-semibold">${placeName}</span><span class="text-slate-500 text-[11px]">(${itemsForPlace.length})</span></div>`;
    cardsContainer.appendChild(placeWrap);
    if (placeCollapsed) return;
    const grouped = new Map();
    itemsForPlace.forEach(row => {
      const catKey = row.category || 'Без категории';
      if (!grouped.has(catKey)) grouped.set(catKey, []);
      grouped.get(catKey).push(row);
    });
    grouped.forEach((items, category) => {
      const catId = `cat-${normalizeKey(category)}-${normalizeKey(placeName)}`;
      const catCollapsed = collapsedCategories.has(catId);
      const catBlock = document.createElement('div');
      catBlock.className = 'mb-2';
      catBlock.innerHTML = `<div class="group-category-row cursor-pointer px-3 py-2 border border-slate-200 rounded-md bg-white flex items-center gap-3" data-toggle="${catId}" data-category="${catId}"><span class="group-toggle">${catCollapsed ? '+' : '−'}</span><span class="flex flex-col leading-tight">${category || 'Без категории'}</span><span class="text-xs text-slate-500">(${items.length} поз.)</span></div>`;
      cardsContainer.appendChild(catBlock);
      if (catCollapsed) return;
      const grid = document.createElement('div');
      grid.className = 'card-grid';
      items.forEach(row => {
        const nameNeedles = [...(highlights.name || []), ...(highlights.search || [])];
        const skuNeedles = [...(highlights.sku || []), ...(highlights.search || [])];
        const descNeedles = [...(highlights.description || []), ...(highlights.search || [])];
        const modNeedles = [...(highlights.modifiers || []), ...(highlights.search || [])];
        const catNeedles = [...(highlights.category || []), ...(highlights.search || [])];
        const modifiersHtml = buildModifiersHtml(row);
        const availabilityBadge = row.stopList ? '<span class="photo-badge red">В стопе</span>' : (row.available ? '<span class="photo-badge green">Доступно</span>' : '<span class="photo-badge red">Нет</span>');
        const imgHtml = row.image
          ? `<div class="photo-wrap"><img class="card-photo" src="/img?url=${encodeURIComponent(row.image)}&thumb=1" alt="${row.name}" loading="lazy" decoding="async" />${availabilityBadge}</div>`
          : `<div class="photo-wrap"><div class="card-photo placeholder">нет фото</div>${availabilityBadge}</div>`;
        const card = document.createElement('div');
        card.className = `menu-card ${row.stopList ? 'bg-rose-50/60 border-rose-100' : ''}`;
        card.dataset.category = catId;
        card.dataset.itemIndex = normalizedMenuRows.indexOf(row);
        card.innerHTML = `
          <div class="text-xs text-slate-500">${highlightValue(row.category || 'Без категории', catNeedles)}</div>
          <h4 title="${escapeHtml(row.name || '')}">${highlightValue(row.name || '', nameNeedles)}</h4>
          ${imgHtml}
          <div class="meta-line"><span class="font-semibold">SKU:</span> ${highlightValue(row.id || '—', skuNeedles)}</div>
          <div class="card-modifiers">${highlightValue(modifiersHtml, modNeedles, { rawHtml: true })}</div>
          <div class="card-footer">
            <span class="price-strong">${formatPrice(row.price)}</span>
          </div>
          <div class="text-xs text-slate-600 card-divider">${highlightValue(row.description || '', descNeedles)}</div>
        `;
        grid.appendChild(card);
      });
      cardsContainer.appendChild(grid);
    });
  });
}

function renderMenuView(rows, highlights = {}) {
  const mode = viewMode || 'list';
  const data = prepareMenuData(rows);
  if (menuTable) menuTable.style.display = mode === 'list' ? 'table' : 'none';
  if (cardsContainer) cardsContainer.classList.toggle('active', mode === 'cards');
  if (mode === 'cards') {
    renderMenuCards(data, highlights, true);
  } else {
    renderMenuTable(data, highlights, true);
  }
  updateSummaryFromRows(data);
}

function setAllPlaceCollapse(collapse = true) {
  const names = new Set(renderedMenuRows.map(r => r.place || 'Без точки'));
  collapsedPlaces.clear();
  if (collapse) names.forEach(n => collapsedPlaces.add(n));
}

function setAllCategoryCollapse(collapse = true) {
  const ids = new Set(renderedMenuRows.map(r => `cat-${normalizeKey(r.category)}-${normalizeKey(r.place)}`));
  collapsedCategories.clear();
  if (collapse) ids.forEach(i => collapsedCategories.add(i));
}

function collectStopRows(term = '') {
  const search = (term || '').toLowerCase();
  const selectedIds = getSelectedPlaceIds();
  const selectedSet = new Set(selectedIds);
  const seen = new Set();
  const menuIndex = new Map();
  normalizedMenuRows.forEach(r => {
    if (!r.id) return;
    const key = `${r.placeId || r.place || ''}:::${r.id}`;
    menuIndex.set(key, r);
  });

  const rows = [];
  const availabilityPlaces = selectedIds.length ? selectedIds : Array.from(availabilityCache.keys());
  availabilityPlaces.forEach(pid => {
    const map = availabilityCache.get(pid);
    if (!map) return;
    const meta = getPlaceMeta(pid);
    map.forEach((availability, id) => {
      const inStop = availability?.available === false || availability?.quantity === 0 || availability?.stock === 0;
      if (!inStop) return;
      const indexKey = `${pid}:::${id}`;
      const matchedRow = menuIndex.get(indexKey) || normalizedMenuRows.find(r => r.id === id && (!selectedSet.size || selectedSet.has(r.placeId)));
      const placeName = matchedRow?.place || meta.placeName || 'Без точки';
      const cat = matchedRow?.category || availability?.category || 'Без категории';
      const name = matchedRow?.name || availability?.name || id;
      const candidate = {
        ...(matchedRow || {}),
        place: placeName,
        placeId: matchedRow?.placeId || pid,
        category: cat,
        name,
        id,
        price: matchedRow?.price || availability?.price || '',
        image: matchedRow?.image || availability?.image || '',
        stopDate: availability?.date || matchedRow?.stopDate || '',
        stopList: true,
      };
      const key = `${candidate.placeId || candidate.place}:::${candidate.id}`;
      if (!seen.has(key)) {
        rows.push(candidate);
        seen.add(key);
      }
    });
  });

  normalizedMenuRows.forEach(row => {
    if (!row.stopList) return;
    if (selectedSet.size && !selectedSet.has(row.placeId)) return;
    const key = `${row.placeId || row.place}:::${row.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push(row);
  });

  if (!search) return rows;
  return rows.filter(r => `${r.name} ${r.id} ${r.category} ${r.place}`.toLowerCase().includes(search));
}

function setStopCollapseAll(term = '', collapse = true) {
  const stops = collectStopRows(term);
  if (!collapse) {
    collapsedStopPlaces.clear();
    collapsedStopCategories.clear();
    return;
  }
  const placeKeys = new Set();
  const catKeys = new Set();
  stops.forEach(r => {
    const placeKey = `stop-${normalizeKey(r.place || 'Без точки')}`;
    placeKeys.add(placeKey);
    const catKey = `${placeKey}::${normalizeKey(r.category || 'Без категории')}`;
    catKeys.add(catKey);
  });
  collapsedStopPlaces.clear();
  collapsedStopCategories.clear();
  placeKeys.forEach(k => collapsedStopPlaces.add(k));
  catKeys.forEach(k => collapsedStopCategories.add(k));
}

function showStopLoading(message = 'Готовим стоп-лист...') {
  if (!stopOverlay || !stopTableBody) return;
  stopOverlay.classList.add('active');
  stopTableBody.innerHTML = `<tr><td colspan="6" class="px-3 py-4 text-center text-slate-600 animate-pulse">${message}</td></tr>`;
}

async function renderStopListPanel(term = '') {
  if (!stopOverlay || !stopTableBody) return;
  if (stopSearchInput && !term) stopSearchInput.value = '';

  const stops = collectStopRows(term);
  stopTableBody.innerHTML = '';
  const needles = term ? [term] : [];

  const grouped = new Map();
  stops.forEach(r => {
    const place = r.place || 'Без точки';
    const cat = r.category || 'Без категории';
    if (!grouped.has(place)) grouped.set(place, new Map());
    const catMap = grouped.get(place);
    if (!catMap.has(cat)) catMap.set(cat, []);
    catMap.get(cat).push(r);
  });

  if (!grouped.size) {
    stopTableBody.innerHTML = `<tr><td colspan="6" class="px-2 py-2 text-center text-slate-500">Стоп-лист пуст.</td></tr>`;
    stopOverlay.classList.add('active');
    return;
  }

  let html = '';
  grouped.forEach((cats, place) => {
    const placeKey = `stop-${normalizeKey(place)}`;
    const placeCollapsed = collapsedStopPlaces.has(placeKey);
    html += `<tr class="group-city-row cursor-pointer" data-stop-place="${placeKey}"><th colspan="6" class="px-3 py-1 text-left"><div class="flex items-center gap-2"><span class="group-toggle">${placeCollapsed ? '+' : '−'}</span><span>${place}</span><span class="text-[11px] text-slate-500">(${Array.from(cats.values()).reduce((a,b)=>a+b.length,0)})</span></div></th></tr>`;
    if (placeCollapsed) return;
    cats.forEach((rows, cat) => {
      const catKey = `${placeKey}::${normalizeKey(cat)}`;
      const catCollapsed = collapsedStopCategories.has(catKey);
      html += `<tr class="group-category-row cursor-pointer" data-stop-category="${catKey}"><th colspan="6" class="px-3 py-1 text-left flex items-center gap-2"><span class="group-toggle">${catCollapsed ? '+' : '−'}</span><span class="text-[12px]">${cat}</span><span class="text-[11px] text-slate-500">(${rows.length})</span></th></tr>`;
      if (catCollapsed) return;
      rows.forEach(r => {
        const img = r.image ? `<img class="menu-img" src="/img?url=${encodeURIComponent(r.image)}&thumb=1" alt="" />` : '<div class="menu-img placeholder">нет фото</div>';
        html += `<tr class="border-b border-slate-100">` +
          `<td class="px-2 py-1 text-sm text-slate-700">${highlightValue(r.category || 'Без категории', needles)}</td>` +
          `<td class="px-2 py-1 text-sm">${highlightValue(r.name, needles)}</td>` +
          `<td class="px-2 py-1 text-center">${img}</td>` +
          `<td class="px-2 py-1 text-xs text-slate-500 text-center">${highlightValue(r.id || '', needles)}</td>` +
          `<td class="px-2 py-1 text-center price-strong">${formatPrice(r.price)}</td>` +
          `<td class="px-2 py-1 text-xs text-slate-500 text-center">${highlightValue(r.stopDate || '—', needles)}</td>` +
          `</tr>`;
      });
    });
  });
  stopTableBody.innerHTML = html;
  stopOverlay.classList.add('active');
}

function filterStopList(term) {
  renderStopListPanel(term);
}

async function openStopListOverlay() {
  const ids = getSelectedPlaceIds();
  if (!ids.length) {
    setStatus('Выберите точку для стоп-листа.', 'err');
    return;
  }
  showStopLoading();
  buttonLoading(stopListBtn, true, 'Готовим стоп-лист...');
  setStatus('Обновляем стоп-лист...', 'info');
  try {
    for (const id of ids) {
      await runAvailabilityFor(id, { renderList: true, silent: true });
    }
    renderStopListPanel(stopSearchInput?.value || '');
    setStatus('Стоп-лист обновлён.', 'ok');
  } catch (e) {
    showStopLoading('Не удалось обновить стоп-лист');
    setStatus(e.message || 'Ошибка обновления стоп-листа', 'err');
  } finally {
    buttonLoading(stopListBtn, false);
  }
}

function buildModifiersHtml(row) {
  const groups = row.modifierGroups || [];
  if (groups.length) {
    return groups.map(g => {
      const mods = (g.modifiers || []).map(m => `<div class="mod-row">
          <span class="mod-name">${m.name || 'Модификатор'}</span>
          <span class="mod-sku">SKU: ${m.id || '—'}</span>
          <span class="mod-price">${formatPrice(m.price)}</span>
        </div>`).join('') || '<div class="text-[11px] text-slate-500 text-center">Нет модификаторов</div>';
      return `<div class="modifier-block">
        <div class="mod-header">${g.name || 'Группа модификаторов'}</div>
        <div class="mod-meta">мин ${g.min ?? 0} / макс ${g.max ?? 0}${g.required ? ' (обязательно)' : ''}</div>
        ${mods}
      </div>`;
    }).join('');
  }
  if (row.modifiers && row.modifiers.length) {
    return row.modifiers.map(m => `${m.name}${m.id ? ` (${m.id})` : ''}${m.price ? ` · ${m.price}` : ''}`).join(', ');
  }
  return '<span class="text-xs text-slate-400">Нет модификаторов</span>';
}

function persistSession() {
  try {
    const state = {
      client_id: clientIdInput.value,
      client_secret: clientSecretInput.value,
      webhook_url: webhookUrlInput.value,
      integration: integrationNameInput.value,
      placeIds: Array.from(selectedPlaceIds),
      menu: lastMenuPayload,
      filters: {
        category: filterCategoryInput?.value || '',
        name: filterNameInput?.value || '',
        sku: filterSkuInput?.value || '',
        description: filterDescriptionInput?.value || '',
        modifiers: filterModifiersInput?.value || '',
        price: filterPriceInput?.value || '',
        availability: filterAvailabilityInput?.value || '',
        search: filterSearchInput?.value || ''
      },
      showModifiers,
      showDescription,
      showStopItems,
      viewMode,
      normalizedMenuRows,
      sortField,
      sortDir
    };
    localStorage.setItem(YANDEX_STATE_KEY, encodeSecret(JSON.stringify(state)));
  } catch (e) {
    console.warn('Cannot persist session', e);
  }
}

function restoreSession({ hydrateMenu = true } = {}) {
  if (isFreshSession) return;
  if (restoredSession) return;
  restoredSession = true;
  try {
    const raw = localStorage.getItem(YANDEX_STATE_KEY);
    if (!raw) return;
    const decoded = decodeSecret(raw) || raw;
    const state = JSON.parse(decoded);
    if (state.client_id) clientIdInput.value = state.client_id;
    if (state.client_secret) clientSecretInput.value = state.client_secret;
    if (state.webhook_url) webhookUrlInput.value = state.webhook_url;
    if (state.integration) integrationNameInput.value = state.integration;
    if (state.placeIds && Array.isArray(state.placeIds)) {
      selectedPlaceIds = new Set(state.placeIds);
      restorePlaceId = state.placeIds[0];
    }
    if (state.filters) {
      if (filterCategoryInput) filterCategoryInput.value = state.filters.category || '';
      if (filterNameInput) filterNameInput.value = state.filters.name || '';
      if (filterSkuInput) filterSkuInput.value = state.filters.sku || '';
      if (filterDescriptionInput) filterDescriptionInput.value = state.filters.description || '';
      if (filterModifiersInput) filterModifiersInput.value = state.filters.modifiers || '';
      if (filterPriceInput) filterPriceInput.value = state.filters.price || '';
      if (filterAvailabilityInput) filterAvailabilityInput.value = state.filters.availability || '';
      if (filterSearchInput) filterSearchInput.value = state.filters.search || '';
    }
    if (typeof state.showModifiers === 'boolean') showModifiers = state.showModifiers;
    if (typeof state.showDescription === 'boolean') showDescription = state.showDescription;
    if (typeof state.showStopItems === 'boolean') showStopItems = state.showStopItems;
    if (state.viewMode) viewMode = state.viewMode;
    if (state.sortField) sortField = state.sortField;
    if (state.sortDir) sortDir = state.sortDir;
    if (hydrateMenu && Array.isArray(state.normalizedMenuRows) && state.normalizedMenuRows.length) {
      normalizedMenuRows = state.normalizedMenuRows;
      renderMenuView(normalizedMenuRows);
      applyMenuFilters();
    } else if (hydrateMenu && state.menu) {
      renderMenu(state.menu);
    }
    if (hydrateMenu && !cachedPlaces.length && loadCitiesBtn) {
      loadCitiesBtn.click();
    }
  } catch (e) {
    console.warn('Cannot restore session', e);
  }
}

function showDishOverlay(row, fullImg) {
  if (!overlay) return;
  overlayTitle.textContent = row.name || '';
  overlaySku.textContent = row.id ? `SKU: ${row.id}` : '';
  overlayImage.src = fullImg || row.image || '';
  overlayAvailability.className = `pill ${row.available ? 'green' : 'red'}`;
  overlayAvailability.textContent = row.available ? 'Доступно' : 'В стоп-листе';
  overlayPrice.textContent = formatPrice(row.price) || '';
  overlayDescription.textContent = row.description || 'Описание отсутствует';
  overlayModifiers.innerHTML = '';
  (row.modifierGroups || []).forEach(g => {
    const block = document.createElement('div');
    block.className = 'modifier-block';
    const header = document.createElement('div');
    header.className = 'mod-header';
    header.textContent = g.name || 'Группа модификаторов';
    const meta = document.createElement('div');
    meta.className = 'mod-meta';
    meta.textContent = `мин ${g.min ?? 0} / макс ${g.max ?? 0}${g.required ? ' (обязательно)' : ''}`;
    block.appendChild(header);
    block.appendChild(meta);
    const list = document.createElement('div');
    if (g.modifiers && g.modifiers.length) {
      g.modifiers.forEach(m => {
        const rowEl = document.createElement('div');
        rowEl.className = 'mod-row';
        rowEl.innerHTML = `<span class="mod-name">${m.name || 'Модификатор'}</span><span class="mod-sku">SKU: ${m.id || '—'}</span><span class="mod-price">${formatPrice(m.price)}</span>`;
        list.appendChild(rowEl);
      });
    } else {
      const empty = document.createElement('div');
      empty.className = 'text-[11px] text-slate-500 text-center py-2';
      empty.textContent = 'Нет модификаторов';
      list.appendChild(empty);
    }
    block.appendChild(list);
    overlayModifiers.appendChild(block);
  });
  if (!(row.modifierGroups || []).length && !(row.modifiers || []).length) {
    const empty = document.createElement('div');
    empty.className = 'text-xs text-slate-500';
    empty.textContent = 'Нет модификаторов';
    overlayModifiers.appendChild(empty);
  }
  overlay.classList.add('active');
}

function updateCurrentInfo() {
  const selected = selectedPlaceIds.size ? Array.from(selectedPlaceIds) : [placeSelect.value].filter(Boolean);
  const labels = selected.map(id => {
    const opt = Array.from(placeSelect.options).find(o => o.value === id);
    return opt ? opt.textContent : id;
  });
  const labelText = labels.length ? labels.join(', ') : 'Выберите точку';
  if (currentPlace) {
    currentPlace.innerHTML = labels.length
      ? `<span class="pill green">${labelText}</span>`
      : '<span class="pill red">Точка не выбрана</span>';
  }
  if (placeToggleLabel) placeToggleLabel.textContent = labelText;
  if (menuTitle) menuTitle.textContent = labels.length ? `Меню «${labels.join(', ')}»` : 'Меню выбранной точки';
  persistSession();
}

async function loadScheduleForPlace(placeId) {
  if (!placeId) return;
  try {
    const data = await callYandex('/api/yandex/schedule', { params: { restaurant_id: placeId } });
    const schedule = data?.schedule || data?.items || data;
    cachedSchedule.set(placeId, schedule);
    const option = placeSelect.options[placeSelect.selectedIndex];
    renderPlaceCard(option);
  } catch (e) {
    console.warn('schedule', e.message || e);
  }
}

async function loadCities({ skipYandex = false } = {}) {
  buttonLoading(loadCitiesBtn, true, 'Обновляем точки...');
  try {
    await runRestaurants();
    const total = allPlaces.length || cachedPlaces.length;
    setStatus(`Загружено ${total} ресторанов.`, 'ok');
  } catch (e) {
    setStatus(e.message || 'Не удалось обновить точки', 'err');
  } finally {
    buttonLoading(loadCitiesBtn, false);
  }
}

async function loadMenu() {
  const creds = getCreds();
  if (!creds) return;
  const placeIds = getSelectedPlaceIds();
  if (!placeIds.length) {
    setStatus('Выберите организацию, чтобы загрузить меню.', 'err');
    return;
  }
  buttonLoading(loadMenuBtn, true, 'Загружаем меню...');
  const entries = [];
  try {
    for (const pid of placeIds) {
      try {
        const data = await callYandex('/api/yandex/menu', { params: { restaurant_id: pid } });
        let availabilityMap;
        try {
          const availability = await callYandex('/api/yandex/availability', { params: { restaurant_id: pid } });
          availabilityMap = buildAvailabilityMap(availability);
          availabilityCache.set(pid, availabilityMap);
        } catch (err) {
          console.warn('Availability request failed', err);
        }
        const placeMeta = getPlaceMeta(pid);
        entries.push({ payload: data, availabilityMap, meta: placeMeta, placeId: pid });
      } catch (err) {
        console.error('Ошибка меню по точке', pid, err);
        setStatus(`Ошибка по точке ${pid}: ${err.message || err}`, 'err');
      }
    }
    renderMenuAggregate(entries);
    setStatus('Меню и стоп-лист загружены.', 'ok');
  } catch (e) {
    setStatus(e.message || 'Не удалось загрузить меню', 'err');
  } finally {
    buttonLoading(loadMenuBtn, false);
    updateCurrentInfo();
  }
}

async function loadIntegrationsList() {
  try {
    const data = await apiFetch('/api/webhooks');
    renderIntegrations(data.items || []);
  } catch (e) {
    console.error(e);
  }
}

async function saveIntegration() {
  const creds = getCreds();
  if (!creds) return;
  const webhook = getWebhookUrl();
  const name = integrationNameInput.value.trim();
  if (!webhook) {
    setStatus('Укажите URL вебхука.', 'err');
    return;
  }
  if (!name) {
    setStatus('Задайте название интеграции.', 'err');
    return;
  }
  buttonLoading(saveIntegrationBtn, true, 'Сохраняем...');
  try {
    const iikoKey = iikoKeyInput?.value?.trim() || storedIikoKey;
    syncStoredIikoKey(iikoKey);
    await apiFetch('/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        webhook_url: webhook,
        client_id: creds.client_id,
        client_secret: creds.client_secret,
        provider: 'yandex',
        iiko_key: iikoKey,
      }),
    });
    setStatus(`Интеграция «${name}» сохранена. Для подключения нажмите «Проверить доступ».`, 'info');
    await loadIntegrationsList();
    integrationSelect.value = name;
  } catch (e) {
    setStatus(e.message || 'Не удалось сохранить интеграцию', 'err');
  } finally {
    buttonLoading(saveIntegrationBtn, false);
  }
}

async function deleteIntegration() {
  const name = integrationSelect.value;
  if (!name) {
    setStatus('Сначала выберите интеграцию.', 'err');
    return;
  }
  buttonLoading(deleteIntegrationBtn, true, '...');
  try {
    await apiFetch(`/api/webhooks/${encodeURIComponent(name)}`, { method: 'DELETE' });
    setStatus(`Интеграция «${name}» удалена из списка.`, 'info');
    await loadIntegrationsList();
    integrationSelect.value = '';
  } catch (e) {
    setStatus(e.message || 'Не удалось удалить интеграцию', 'err');
  } finally {
    buttonLoading(deleteIntegrationBtn, false);
  }
}

async function runAvailabilityFor(placeId, { renderList = false, silent = false } = {}) {
  const restaurantId = placeId || getRestaurantId();
  if (!restaurantId) return setStatus('Укажите restaurant_id (выберите точку или заполните поле).', 'err');
  try {
    const data = await callYandex('/api/yandex/availability', { params: { restaurant_id: restaurantId } });
    const stopItems = buildAvailabilityMap(data);
    availabilityCache.set(restaurantId, stopItems);
    applyAvailabilityToRows(restaurantId, stopItems);
    renderMenuView(normalizedMenuRows);
    if (!silent) {
      renderExtraResult(renderList ? 'Стоп-лист' : 'Недоступные позиции', data);
      setStatus('Получены данные о недоступных позициях.', 'ok');
    }
  } catch (e) {
    setStatus(e.message || 'Не удалось получить availability', 'err');
  }
}

async function runPromos() {
  const placeId = getRestaurantId();
  if (!placeId) return setStatus('Укажите restaurant_id (выберите точку или заполните поле).', 'err');
  try {
    const data = await callYandex('/api/yandex/promos', { params: { restaurant_id: placeId } });
    renderExtraResult('Акционные позиции', data);
    setStatus('Акции получены.', 'ok');
  } catch (e) {
    setStatus(e.message || 'Не удалось получить акции', 'err');
  }
}

async function runZones() {
  const placeId = getRestaurantId();
  if (!placeId) return setStatus('Укажите restaurant_id (выберите точку или заполните поле).', 'err');
  try {
    const data = await callYandex('/api/yandex/delivery_zones', { params: { restaurant_id: placeId } });
    renderExtraResult('Зоны доставки', data);
    setStatus('Зоны доставки получены.', 'ok');
  } catch (e) {
    setStatus(e.message || 'Не удалось получить зоны доставки', 'err');
  }
}

async function runSchedule() {
  const placeId = getRestaurantId();
  if (!placeId) return setStatus('Укажите restaurant_id (выберите точку или заполните поле).', 'err');
  try {
    const data = await callYandex('/api/yandex/schedule', { params: { restaurant_id: placeId } });
    renderExtraResult('График работы', data);
    setStatus('График получен.', 'ok');
  } catch (e) {
    setStatus(e.message || 'Не удалось получить график', 'err');
  }
}

async function runMenuComposition() {
  const placeId = getRestaurantId();
  if (!placeId) return setStatus('Укажите restaurant_id (выберите точку или заполните поле).', 'err');
  try {
    const data = await callYandex('/api/yandex/menu', { params: { restaurant_id: placeId } });
    let availabilityMap;
    try {
      const availability = await callYandex('/api/yandex/availability', { params: { restaurant_id: placeId } });
      availabilityMap = buildAvailabilityMap(availability);
    } catch (err) {
      console.warn('Availability request failed', err);
    }
    renderMenu(data, availabilityMap);
    renderExtraResult('Меню (composition)', data);
    setStatus('Меню (composition) получено.', 'ok');
  } catch (e) {
    setStatus(e.message || 'Не удалось получить меню', 'err');
  }
}

async function runOrders() {
  const status = orderStatusInput?.value?.trim();
  try {
    const data = await callYandex('/api/yandex/orders', { params: status ? { status } : {} });
    renderExtraResult('Текущие заказы', data);
    setStatus('Заказы получены.', 'ok');
  } catch (e) {
    setStatus(e.message || 'Не удалось получить заказы', 'err');
  }
}

async function runOrderStatus() {
  const orderId = orderIdInput?.value?.trim();
  if (!orderId) return setStatus('Укажите order_id для статуса.', 'err');
  try {
    const data = await callYandex('/api/yandex/order/status', { params: { order_id: orderId } });
    renderExtraResult('Статус заказа', data);
    setStatus('Статус заказа получен.', 'ok');
  } catch (e) {
    setStatus(e.message || 'Не удалось получить статус', 'err');
  }
}

function parseOrderPayload() {
  const raw = orderPayloadInput?.value?.trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (e) {
    setStatus('Неверный JSON payload для заказа.', 'err');
    throw e;
  }
}

async function runCreateOrder() {
  try {
    const payload = parseOrderPayload();
    const data = await callYandex('/api/yandex/order', { method: 'POST', body: payload });
    renderExtraResult('Создание заказа', data);
    setStatus('Заказ создан.', 'ok');
  } catch (e) {
    setStatus(e.message || 'Не удалось создать заказ', 'err');
  }
}

async function runUpdateOrder() {
  const orderId = orderIdInput?.value?.trim();
  if (!orderId) return setStatus('Укажите order_id для обновления.', 'err');
  try {
    const payload = parseOrderPayload();
    const data = await callYandex('/api/yandex/order/update', { method: 'PUT', body: { ...payload, order_id: orderId } });
    renderExtraResult('Обновление заказа', data);
    setStatus('Заказ обновлён.', 'ok');
  } catch (e) {
    setStatus(e.message || 'Не удалось обновить заказ', 'err');
  }
}

async function runCancelOrder() {
  const orderId = orderIdInput?.value?.trim();
  if (!orderId) return setStatus('Укажите order_id для отмены.', 'err');
  try {
    const payload = parseOrderPayload();
    const data = await callYandex('/api/yandex/order/cancel', { method: 'DELETE', body: { ...payload, order_id: orderId } });
    renderExtraResult('Отмена заказа', data);
    setStatus('Заказ отменён.', 'ok');
  } catch (e) {
    setStatus(e.message || 'Не удалось отменить заказ', 'err');
  }
}

function parseHistoryPayload() {
  const raw = ordersHistoryPayloadInput?.value?.trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (e) {
    setStatus('Неверный JSON для истории заказов.', 'err');
    throw e;
  }
}

async function runOrdersHistory() {
  let body;
  try {
    body = parseHistoryPayload();
  } catch {
    return;
  }
  try {
    const data = await callYandex('/api/yandex/orders/history', { method: 'POST', body });
    renderHistory(data, 'История заказов');
    setStatus('История заказов получена.', 'ok');
  } catch (e) {
    setStatus(e.message || 'Не удалось получить историю заказов', 'err');
  }
}

async function runOrderDetails() {
  let body;
  try {
    body = parseHistoryPayload();
  } catch {
    return;
  }
  if (!body.orderIds && !body.order_ids) {
    setStatus('Для детализации укажите orderIds в теле запроса.', 'err');
    return;
  }
  try {
    const data = await callYandex('/api/yandex/orders/details', { method: 'POST', body });
    renderHistory(data, 'Детали заказов');
    setStatus('Детали заказов получены.', 'ok');
  } catch (e) {
    setStatus(e.message || 'Не удалось получить детали заказов', 'err');
  }
}

async function runRestaurants() {
  try {
    const data = await callYandex('/api/yandex/restaurants');
    const places = normalizePlaces(data);
    if (places.length) {
      renderPlaces(places);
      setStatus(`Точек: ${places.length}. Выберите ресторан и загрузите меню.`, 'ok');
    } else {
      setStatus('Рестораны получены, но список пуст.', 'warn');
    }
    renderExtraResult('Список ресторанов', data);
  } catch (e) {
    setStatus(e.message || 'Не удалось получить рестораны', 'err');
  }
}

connectBtn.addEventListener('click', verifyAccess);
loadCitiesBtn.addEventListener('click', loadCities);
loadMenuBtn.addEventListener('click', loadMenu);
placeSelect.addEventListener('change', () => {
  updateCurrentInfo();
  const option = placeSelect.options[placeSelect.selectedIndex];
  const placeId = option?.dataset?.placeId || '';
  if (placeId) {
    placeIdManual.value = placeId;
    loadScheduleForPlace(placeId);
  } else {
    placeIdManual.value = '';
    setStatus('У выбранной точки нет связанного restaurant_id. Укажите вручную.', 'info');
  }
});
integrationSelect.addEventListener('change', () => {
  if (integrationSelect.value) {
    applyIntegration(integrationSelect.value);
  } else {
    resetMenuState();
  }
});

addIntegrationBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  startNewIntegration();
});
btnAvailability?.addEventListener('click', () => runAvailabilityFor());
btnPromos?.addEventListener('click', runPromos);
btnZones?.addEventListener('click', runZones);
btnSchedule?.addEventListener('click', runSchedule);
btnMenuFull?.addEventListener('click', runMenuComposition);
btnOrders?.addEventListener('click', runOrders);
btnOrdersHistory?.addEventListener('click', runOrdersHistory);
iikoKeyInput?.addEventListener('change', (e) => syncStoredIikoKey(e.target.value.trim()));
btnOrderDetails?.addEventListener('click', runOrderDetails);
btnOrderStatus?.addEventListener('click', runOrderStatus);
btnCreateOrder?.addEventListener('click', runCreateOrder);
btnUpdateOrder?.addEventListener('click', runUpdateOrder);
btnCancelOrder?.addEventListener('click', runCancelOrder);
btnLoadRestaurants?.addEventListener('click', runRestaurants);
saveIntegrationBtn.addEventListener('click', saveIntegration);
deleteIntegrationBtn.addEventListener('click', deleteIntegration);
placeSearchInput?.addEventListener('input', () => filterPlaces(placeSearchInput.value));
placeToggle?.addEventListener('click', () => {
  placeToggle.closest('.picker')?.classList.toggle('open');
});
selectAllPlacesBtn?.addEventListener('click', (e) => { e.preventDefault(); selectAllPlaces(); });
clearAllPlacesBtn?.addEventListener('click', (e) => { e.preventDefault(); clearAllPlaces(); });
togglePlacesBtn?.addEventListener('click', () => {
  const collapse = collapsedPlaces.size === 0;
  setAllPlaceCollapse(collapse);
  togglePlacesBtn.textContent = collapse ? '▴' : '▾';
  renderMenuView(renderedMenuRows);
  persistSession();
});
toggleCategoriesBtn?.addEventListener('click', () => {
  const collapse = collapsedCategories.size === 0;
  setAllCategoryCollapse(collapse);
  toggleCategoriesBtn.textContent = collapse ? '▴' : '▾';
  renderMenuView(renderedMenuRows);
  persistSession();
});
placeList?.addEventListener('click', (e) => {
  const btn = e.target.closest('.picker-item');
  if (!btn) return;
  const id = btn.dataset.placeId;
  const opt = Array.from(placeSelect.options).find(o => o.value === id);
  if (opt) {
    placeSelect.value = id;
    updateCurrentInfo();
  }
});

menuTableBody?.addEventListener('click', (e) => {
  const cityRow = e.target.closest('tr.group-city-row');
  if (cityRow?.dataset.place) {
    const placeName = cityRow.dataset.place;
    if (collapsedPlaces.has(placeName)) collapsedPlaces.delete(placeName); else collapsedPlaces.add(placeName);
    renderMenuView(renderedMenuRows);
    return;
  }
  const catRow = e.target.closest('tr.group-category-row');
  if (catRow?.dataset.category) {
    const catId = catRow.dataset.category;
    if (collapsedCategories.has(catId)) collapsedCategories.delete(catId); else collapsedCategories.add(catId);
    renderMenuView(renderedMenuRows);
    return;
  }
  const img = e.target.closest('.menu-img');
  if (img && img.dataset.full) {
    const index = img.closest('tr')?.dataset?.itemIndex;
    const row = normalizedMenuRows[Number(index)] || null;
    if (row) showDishOverlay(row, img.dataset.full);
  }
});
cardsContainer?.addEventListener('click', (e) => {
  const cityRow = e.target.closest('.group-city-row');
  if (cityRow?.dataset.place) {
    const placeName = cityRow.dataset.place;
    if (collapsedPlaces.has(placeName)) collapsedPlaces.delete(placeName); else collapsedPlaces.add(placeName);
    renderMenuView(renderedMenuRows);
    return;
  }
  const catRow = e.target.closest('.group-category-row');
  if (catRow?.dataset.category) {
    const catId = catRow.dataset.category;
    if (collapsedCategories.has(catId)) collapsedCategories.delete(catId); else collapsedCategories.add(catId);
    renderMenuView(renderedMenuRows);
    return;
  }
  const img = e.target.closest('.card-photo');
  if (img) {
    const card = img.closest('.menu-card');
    const index = card?.dataset?.itemIndex;
    const row = normalizedMenuRows[Number(index)] || null;
    if (row) showDishOverlay(row, img.dataset.full || row.image);
  }
});
stopListBtn?.addEventListener('click', openStopListOverlay);
summaryStop?.addEventListener('click', openStopListOverlay);
stopOverlayClose?.addEventListener('click', () => stopOverlay?.classList.remove('active'));
stopSearchInput?.addEventListener('input', () => filterStopList(stopSearchInput.value));
stopOverlay?.addEventListener('click', (e) => { if (e.target === stopOverlay) stopOverlay.classList.remove('active'); });
expandAllStopBtn?.addEventListener('click', () => { setStopCollapseAll(stopSearchInput?.value || '', false); renderStopListPanel(stopSearchInput?.value || ''); });
collapseAllStopBtn?.addEventListener('click', () => { setStopCollapseAll(stopSearchInput?.value || '', true); renderStopListPanel(stopSearchInput?.value || ''); });
stopExportBtn?.addEventListener('click', async () => {
  try {
    const stops = collectStopRows(stopSearchInput?.value || '');
    if (!stops.length) {
      setStatus('Нет данных для экспорта стоп-листа.', 'err');
      return;
    }
    const grouped = new Map();
    stops.forEach(r => {
      const place = r.place || 'Без точки';
      if (!grouped.has(place)) grouped.set(place, new Map());
      const cat = r.category || 'Без категории';
      const catMap = grouped.get(place);
      if (!catMap.has(cat)) catMap.set(cat, []);
      catMap.get(cat).push(r);
    });
    const columns = [
      { key: 'place', title: 'Город/точка' },
      { key: 'category', title: 'Категория' },
      { key: 'name', title: 'Название' },
      { key: 'photo', title: 'Фото' },
      { key: 'id', title: 'SKU' },
      { key: 'price', title: 'Цена' },
      { key: 'stop', title: 'Дата стопа' }
    ];
    const table_data = [];
    grouped.forEach((cats, place) => {
      table_data.push({ place: place, category: '', name: '', photo: '', id: '', price: '', stop: '' });
      cats.forEach((rows, cat) => {
        table_data.push({ place: place, category: `Категория: ${cat}`, name: '', photo: '', id: '', price: '', stop: '' });
        rows.forEach(row => {
          table_data.push({
            place: place,
            category: cat,
            name: row.name || row.id || '',
            photo: row.image || '',
            id: row.id || '',
            price: row.price || '',
            stop: row.stopDate || ''
          });
        });
      });
    });
    const res = await fetch('/api/export_excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ columns, table_data })
    });
    if (!res.ok) throw new Error('Ошибка экспорта стоп-листа');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yandex_stop_list.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    setStatus('Экспорт стоп-листа завершён.', 'ok');
  } catch (e) {
    setStatus(e.message || 'Ошибка экспорта стоп-листа', 'err');
  }
});
stopTableBody?.addEventListener('click', (e) => {
  const place = e.target.closest('tr[data-stop-place]');
  const cat = e.target.closest('tr[data-stop-category]');
  if (place?.dataset.stopPlace) {
    if (collapsedStopPlaces.has(place.dataset.stopPlace)) collapsedStopPlaces.delete(place.dataset.stopPlace); else collapsedStopPlaces.add(place.dataset.stopPlace);
    renderStopListPanel(stopSearchInput?.value || '');
    return;
  }
  if (cat?.dataset.stopCategory) {
    if (collapsedStopCategories.has(cat.dataset.stopCategory)) collapsedStopCategories.delete(cat.dataset.stopCategory); else collapsedStopCategories.add(cat.dataset.stopCategory);
    renderStopListPanel(stopSearchInput?.value || '');
  }
});
showStopInlineBtn?.addEventListener('click', () => { showStopItems = !showStopItems; showStopInlineBtn.textContent = showStopItems ? 'Скрыть стоп-лист' : 'Показать стоп-лист'; renderMenuView(normalizedMenuRows); persistSession(); });
viewToggle?.addEventListener('click', (e) => {
  e.stopPropagation();
  viewPicker?.classList.toggle('open');
});
document.addEventListener('click', (e) => {
  const placePickerEl = placeToggle?.closest('.picker');
  if (placePickerEl && !placePickerEl.contains(e.target)) placePickerEl.classList.remove('open');
  if (viewPicker && !viewPicker.contains(e.target)) viewPicker.classList.remove('open');
});
document.querySelectorAll('.logout-btn').forEach(btn => btn.addEventListener('click', () => {
  try {
    sessionStorage.removeItem(SESSION_FLAG_KEY);
    sessionStorage.removeItem('indexSessionAlive');
  } catch (e) {
    console.warn('Не удалось очистить маркеры сессии', e);
  }
}));
menuTableBody?.addEventListener('contextmenu', (e) => {
  const cell = e.target.closest('td');
  if (!cell) return;
  e.preventDefault();
  const text = (cell.textContent || '').trim();
  if (text) navigator.clipboard?.writeText(text);
  setStatus('Скопировано в буфер обмена.', 'info');
});

toggleModifiersBtn?.addEventListener('click', () => {
  showModifiers = !showModifiers;
  toggleModifiersBtn.textContent = showModifiers ? 'Модификаторы −' : 'Модификаторы +';
  renderMenuView(normalizedMenuRows);
  persistSession();
});

toggleDescriptionBtn?.addEventListener('click', () => {
  showDescription = !showDescription;
  toggleDescriptionBtn.textContent = showDescription ? 'Скрыть описание' : 'Показать описание';
  renderMenuView(normalizedMenuRows);
  persistSession();
});

exportYandexBtn?.addEventListener('click', async () => {
  try {
    if (!normalizedMenuRows.length) {
      setStatus('Нет данных для экспорта.', 'error');
      return;
    }
    const columns = [
      { key: 'place', title: 'Город/точка' },
      { key: 'category', title: 'Категория' },
      { key: 'name', title: 'Блюдо' },
      { key: 'id', title: 'SKU' },
      { key: 'description', title: 'Описание' },
      { key: 'modifiers', title: 'Модификаторы' },
      { key: 'price', title: 'Цена' },
      { key: 'available', title: 'Доступность' }
    ];
    const source = renderedMenuRows && renderedMenuRows.length ? renderedMenuRows : normalizedMenuRows;
    const grouped = new Map();
    source.forEach(row => {
      const place = row.place || 'Без точки';
      if (!grouped.has(place)) grouped.set(place, new Map());
      const catMap = grouped.get(place);
      const cat = row.category || 'Без категории';
      if (!catMap.has(cat)) catMap.set(cat, []);
      catMap.get(cat).push(row);
    });

    const table_data = [];
    grouped.forEach((cats, place) => {
      table_data.push({ place: place, category: '', name: '', id: '', description: '', modifiers: '', price: '', available: '' });
      cats.forEach((items, cat) => {
        table_data.push({ place: place, category: `Категория: ${cat}`, name: '', id: '', description: '', modifiers: '', price: '', available: '' });
        items.forEach(row => {
          table_data.push({
            place: place,
            category: cat,
            name: row.name || '',
            id: row.id || '',
            description: showDescription ? (row.description || '') : '',
            modifiers: showModifiers ? (stripHtml(buildModifiersHtml(row)) || '') : '',
            price: row.price || '',
            available: row.stopList ? 'В стоп-листе' : (row.available ? 'Доступно' : 'Недоступно')
          });
        });
      });
    });
    const res = await fetch('/api/export_excel', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ table_data, columns })
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || 'Ошибка экспорта');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yandex_menu.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    setStatus('Экспорт завершён.', 'success');
  } catch (e) {
    setStatus(e.message || 'Ошибка экспорта', 'error');
  }
});
filterCategoryInput?.addEventListener('input', applyMenuFilters);
filterNameInput?.addEventListener('input', applyMenuFilters);
filterSkuInput?.addEventListener('input', applyMenuFilters);
filterDescriptionInput?.addEventListener('input', applyMenuFilters);
filterModifiersInput?.addEventListener('input', applyMenuFilters);
filterPriceInput?.addEventListener('input', applyMenuFilters);
filterAvailabilityInput?.addEventListener('input', applyMenuFilters);
filterSearchInput?.addEventListener('input', applyMenuFilters);
renderViewOptions();
overlayClose?.addEventListener('click', () => overlay?.classList.remove('active'));
overlay?.addEventListener('click', (e) => {
  if (e.target === overlay) overlay.classList.remove('active');
});

(async () => {
  await bootstrapUserKey();
  if (!isFreshSession && iikoKeyInput && storedIikoKey && !iikoKeyInput.value) {
    iikoKeyInput.value = storedIikoKey;
  }
  restoreSession({ hydrateMenu: !isFreshSession });
  renderViewOptions();
  if (toggleModifiersBtn) toggleModifiersBtn.textContent = showModifiers ? 'Модификаторы −' : 'Модификаторы +';
  if (toggleDescriptionBtn) toggleDescriptionBtn.textContent = showDescription ? 'Скрыть описание' : 'Показать описание';
  setStatus('Введите client_id и client_secret для подключения.');
  await loadIntegrationsList();
  if (!isFreshSession && webhookUrlInput.value && clientIdInput.value && clientSecretInput.value) {
    loadCities();
  }
})();
