const clientIdInput = document.getElementById('clientId');
const clientSecretInput = document.getElementById('clientSecret');
const connectBtn = document.getElementById('connectBtn');
const loadCitiesBtn = document.getElementById('loadCitiesBtn');
const loadMenuBtn = document.getElementById('loadMenuBtn');
const integrationSelect = document.getElementById('integrationSelect');
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
const stopListBtn = document.getElementById('stopListBtn');
const iikoKeyInput = document.getElementById('iikoKey');
const statusEl = document.getElementById('status');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const placeCount = document.getElementById('placeCount');
const menuCount = document.getElementById('menuCount');
const menuTableBody = document.getElementById('menuTableBody');
const rawPayload = document.getElementById('rawPayload');
const summaryCategories = document.getElementById('summaryCategories');
const summaryModifiers = document.getElementById('summaryModifiers');
const summaryItems = document.getElementById('summaryItems');
const summaryStop = document.getElementById('summaryStop');
const exportYandexBtn = document.getElementById('exportYandexBtn');
const currentPlace = document.getElementById('currentPlace');
const manualBaseInput = document.getElementById('manualBase');
const manualTokenPathInput = document.getElementById('manualTokenPath');
const menuTitle = document.getElementById('menuTitle');
const filterCategoryInput = document.getElementById('filterCategory');
const filterNameInput = document.getElementById('filterName');
const filterSkuInput = document.getElementById('filterSku');
const toggleModifiersBtn = document.getElementById('toggleModifiers');
const toggleDescriptionBtn = document.getElementById('toggleDescription');
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

let cachedPlaces = [];
let iikoOrgs = [];
let yandexPlaces = [];
let lastMenuPayload = null;
let integrations = [];
let cachedSchedule = new Map();
let storedIikoKey = '';
let normalizedMenuRows = [];
let allPlaces = [];
let selectedPlaceIds = new Set();
const YANDEX_STATE_KEY = 'yandexPageState';

function stripHtml(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.innerHTML = str;
  return d.textContent || d.innerText || '';
}

function formatPrice(val) {
  if (val === null || val === undefined || val === '') return '';
  const s = String(val).trim();
  return s.includes('₽') ? s : `${s} ₽`;
}
let showModifiers = true;
let showDescription = false;
let restoredSession = false;
let restorePlaceId = '';

try {
  storedIikoKey = localStorage.getItem('iikoApiLogin') || '';
} catch (e) {
  console.warn('localStorage unavailable', e);
}

function syncStoredIikoKey(value) {
  storedIikoKey = value || storedIikoKey || '';
  try {
    if (storedIikoKey) localStorage.setItem('iikoApiLogin', storedIikoKey);
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
  btn.disabled = isLoading;
  if (isLoading) {
    btn.dataset.label = btn.textContent;
    btn.textContent = label || 'Загрузка...';
    btn.classList.add('opacity-70', 'cursor-wait');
  } else {
    btn.textContent = btn.dataset.label || btn.textContent;
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
  const data = await resp.json().catch(() => ({}));
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
  places.forEach(place => {
    const placeId = place.orgId || place.yandexPlaceId || place.id || place.place_id || '';
    const name = place.name || place.title || place.slug || 'Без названия';
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
    btn.type = 'button';
    btn.className = 'picker-item';
    btn.dataset.placeId = placeId;
    btn.dataset.address = option.dataset.address;
    const checked = selectedPlaceIds.has(placeId) ? '☑' : '☐';
    btn.innerHTML = `<div class="flex flex-col">` +
      `<span class="title">${name}</span>` +
      `<span class="meta">${option.dataset.address || 'Адрес не указан'}</span>` +
      `</div><div class="text-[11px] text-slate-500 flex items-center gap-1">${checked}<span>${placeId}</span></div>`;
    btn.addEventListener('click', () => togglePlaceSelection(placeId));
    placeList.appendChild(btn);
  });
  if (restorePlaceId) {
    if (!selectedPlaceIds.size) selectedPlaceIds = new Set([restorePlaceId]);
  }
  placeCount.textContent = places.length;
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
    const id = entry.id || entry.item_id || entry.product_id || entry.sku || entry.code;
    if (!id) return;
    const available = entry.available ?? entry.is_available ?? entry.in_stock;
    const quantity = entry.balance ?? entry.quantity ?? entry.count ?? entry.stock ?? null;
    map.set(id, { available, quantity });
  });
  return map;
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

function renderMenuAggregate(entries = []) {
  normalizedMenuRows = [];
  let totalItems = 0;
  let totalModifiers = 0;
  let totalStops = 0;
  const categorySet = new Set();
  entries.forEach(entry => {
    const { payload, availabilityMap, meta } = entry;
    lastMenuPayload = payload;
    const menus = collectMenus(payload);
    menus.forEach(menu => {
      const rows = normalizeMenuItems(menu.name, menu.data || {}, availabilityMap, meta);
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
  renderMenuTable(normalizedMenuRows);
  menuCount.textContent = totalItems;
  summaryItems.textContent = `Блюд: ${totalItems || 0}`;
  summaryCategories.textContent = `Категории: ${categorySet.size || 0}`;
  summaryModifiers.textContent = `Модификаторы: ${totalModifiers || 0}`;
  const stopText = totalStops ? `Стоп-лист: ${totalStops}` : 'Стоп-лист';
  summaryStop.textContent = stopText;
  summaryStop.dataset.count = totalStops || '';
}

function applyMenuFilters() {
  const cat = (filterCategoryInput?.value || '').toLowerCase();
  const name = (filterNameInput?.value || '').toLowerCase();
  const sku = (filterSkuInput?.value || '').toLowerCase();
  const filtered = normalizedMenuRows.filter(row => {
    const byCat = !cat || (row.category || '').toLowerCase().includes(cat);
    const byName = !name || (row.name || '').toLowerCase().includes(name);
    const bySku = !sku || (row.id || '').toLowerCase().includes(sku);
    return byCat && byName && bySku;
  });
  renderMenuTable(filtered);
}

function renderMenuTable(rows) {
  if (!menuTableBody) return;
  const data = rows || [];
  menuTableBody.innerHTML = '';
  const placeGroups = new Map();
  data.forEach(row => {
    const key = row.place || 'Без точки';
    if (!placeGroups.has(key)) placeGroups.set(key, []);
    placeGroups.get(key).push(row);
  });

  placeGroups.forEach((itemsForPlace, placeName) => {
    const placeHeader = document.createElement('tr');
    placeHeader.className = 'bg-indigo-50 font-semibold';
    placeHeader.innerHTML = `<td colspan="8" class="px-3 py-2">${placeName}</td>`;
    menuTableBody.appendChild(placeHeader);

    const grouped = new Map();
    itemsForPlace.forEach(row => {
      if (!grouped.has(row.category)) grouped.set(row.category, []);
      grouped.get(row.category).push(row);
    });

    grouped.forEach((items, category) => {
      const catId = `cat-${normalizeKey(category)}-${normalizeKey(placeName)}`;
      const header = document.createElement('tr');
      header.className = 'bg-slate-50 cursor-pointer';
      header.dataset.toggle = catId;
      header.innerHTML = `<td colspan="8" class="px-3 py-2 font-semibold text-slate-800 flex items-center gap-2">
        <span class="pill blue">${category || 'Без категории'}</span>
        <span class="text-xs text-slate-500">${items.length} поз.</span>
      </td>`;
      menuTableBody.appendChild(header);

      items.forEach(row => {
        const stopBadge = row.stopList ? '<span class="stop-pill">В стоп-листе</span>' : '';
        const imageSrc = row.image ? `/img?url=${encodeURIComponent(row.image)}&thumb=1` : '';
        const imageHtml = imageSrc
          ? `<img src="${imageSrc}" data-full="/img?url=${encodeURIComponent(row.image)}" alt="${row.name}" class="menu-img" loading="lazy" decoding="async" />`
          : `<div class="menu-img placeholder">нет фото</div>`;
        const modifiersHtml = buildModifiersHtml(row);
        const tr = document.createElement('tr');
        tr.className = `hover:bg-slate-50 ${row.stopList ? 'bg-rose-50/60' : ''} ${catId}`;
        tr.dataset.category = catId;
        tr.innerHTML = `
          <td class="px-3 py-2 text-slate-800 font-semibold">${row.category || 'Без категории'}</td>
          <td class="px-3 py-2 flex items-center gap-2">${row.name} ${stopBadge}</td>
          <td class="px-3 py-2">${imageHtml}</td>
          <td class="px-3 py-2 text-xs text-slate-500">${row.id || '—'}</td>
          <td class="px-3 py-2 text-xs text-slate-600 ${showDescription ? '' : 'hidden'}">${row.description || ''}</td>
          <td class="px-3 py-2 text-xs text-slate-600 ${showModifiers ? '' : 'hidden'}">${modifiersHtml}</td>
          <td class="px-3 py-2 font-semibold">${row.price || '—'}</td>
          <td class="px-3 py-2">${row.available ? '<span class="pill green">Доступно</span>' : '<span class="pill red">В стоп-листе</span>'}</td>
        `;
        tr.dataset.itemId = row.id;
        tr.dataset.itemIndex = normalizedMenuRows.indexOf(row);
        menuTableBody.appendChild(tr);
      });
    });
  });
}

function renderStopListPanel() {
  const stops = normalizedMenuRows.filter(r => r.stopList);
  if (!stops.length) {
    setStatus('Стоп-лист пуст.', 'info');
    extraResult.innerHTML = '';
    return;
  }
  const rows = stops.map(r => `<tr>
      <td class="px-2 py-1"><img class="menu-img" src="${r.image ? `/img?url=${encodeURIComponent(r.image)}&thumb=1` : ''}" alt=""/></td>
      <td class="px-2 py-1">${r.name}</td>
      <td class="px-2 py-1 text-xs text-slate-500">${r.id}</td>
      <td class="px-2 py-1">${r.price || ''}</td>
    </tr>`).join('');
  extraResult.innerHTML = `<div class="overflow-auto">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-xs text-slate-600">
          <tr><th class="px-2 py-1 text-left">Фото</th><th class="px-2 py-1 text-left">Название</th><th class="px-2 py-1 text-left">SKU</th><th class="px-2 py-1 text-left">Цена</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function buildModifiersHtml(row) {
  const groups = row.modifierGroups || [];
  if (groups.length) {
  return groups.map(g => {
      const mods = (g.modifiers || []).map(m => `<div class="flex justify-between gap-2 text-[11px] items-center">
          <span class="truncate"><span class="font-semibold">${m.name}</span>${m.id ? ` <span class="text-slate-500">(${m.id})</span>` : ''}</span>
          <span class="text-slate-700 whitespace-nowrap">${formatPrice(m.price)}</span>
        </div>`).join('') || '<div class="text-[11px] text-slate-500">Нет модификаторов</div>';
      return `<div class="mb-2">
        <div class="font-semibold text-[12px] text-indigo-700">${g.name || 'Группа модификаторов'}</div>
        <div class="text-[11px] text-slate-500">мин ${g.min ?? 0} / макс ${g.max ?? 0}${g.required ? ' (обязательно)' : ''}</div>
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
        sku: filterSkuInput?.value || ''
      },
      showModifiers,
      showDescription,
      normalizedMenuRows
    };
    localStorage.setItem(YANDEX_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Cannot persist session', e);
  }
}

function restoreSession() {
  if (restoredSession) return;
  restoredSession = true;
  try {
    const raw = localStorage.getItem(YANDEX_STATE_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);
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
    }
    if (typeof state.showModifiers === 'boolean') showModifiers = state.showModifiers;
    if (typeof state.showDescription === 'boolean') showDescription = state.showDescription;
    if (Array.isArray(state.normalizedMenuRows) && state.normalizedMenuRows.length) {
      normalizedMenuRows = state.normalizedMenuRows;
      renderMenuTable(normalizedMenuRows);
    } else if (state.menu) {
      renderMenu(state.menu);
    }
  } catch (e) {
    console.warn('Cannot restore session', e);
  }
}

function showDishOverlay(row, fullImg) {
  if (!overlay) return;
  overlayTitle.textContent = row.name || '';
  overlaySku.textContent = row.id || '';
  overlayImage.src = fullImg || row.image || '';
  overlayAvailability.className = `pill ${row.available ? 'green' : 'red'}`;
  overlayAvailability.textContent = row.available ? 'Доступно' : 'В стоп-листе';
  overlayPrice.textContent = row.price || '';
  overlayDescription.textContent = row.description || 'Описание отсутствует';
  overlayModifiers.innerHTML = '';
  (row.modifierGroups || []).forEach(g => {
    const block = document.createElement('div');
    const modsHtml = (g.modifiers || []).map(m => `<div class="flex justify-between gap-2 text-[12px] items-center">
        <div class="flex flex-col">
          <span class="font-semibold">${m.name}${m.id ? ` (${m.id})` : ''}</span>
          <span class="text-slate-500">мин ${m.min ?? 0} / макс ${m.max ?? 0}</span>
        </div>
        <span class="text-slate-600 whitespace-nowrap">${m.price ? `${m.price} ₽` : ''}</span>
      </div>`).join('') || '<div class="text-[11px] text-slate-500">Модификаторы не заданы</div>';
    block.innerHTML = `<div class="font-semibold text-slate-800">${g.name}</div>
      <div class="text-[11px] text-slate-500 mb-1">мин: ${g.min}, макс: ${g.max}${g.required ? ' (обязательно)' : ''}</div>
      ${modsHtml}`;
    block.className = 'border border-slate-200 rounded-md p-2 bg-white';
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
  currentPlace.innerHTML = labels.length
    ? `<span class="pill green">${labelText}</span>`
    : '<span class="pill red">Точка не выбрана</span>';
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
    setStatus('Список точек обновлен.', 'ok');
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
      const data = await callYandex('/api/yandex/menu', { params: { restaurant_id: pid } });
      let availabilityMap;
      try {
        const availability = await callYandex('/api/yandex/availability', { params: { restaurant_id: pid } });
        availabilityMap = buildAvailabilityMap(availability);
      } catch (err) {
        console.warn('Availability request failed', err);
      }
      const placeMeta = getPlaceMeta(pid);
      entries.push({ payload: data, availabilityMap, meta: placeMeta });
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

async function runAvailabilityFor(placeId, renderList = false) {
  const restaurantId = placeId || getRestaurantId();
  if (!restaurantId) return setStatus('Укажите restaurant_id (выберите точку или заполните поле).', 'err');
  try {
    const data = await callYandex('/api/yandex/availability', { params: { restaurant_id: restaurantId } });
    if (renderList && Array.isArray(normalizedMenuRows) && normalizedMenuRows.length) {
      const stopItems = buildAvailabilityMap(data);
      const items = normalizedMenuRows.filter(row => stopItems.has(row.id) && stopItems.get(row.id)?.available === false);
      const list = items.map(item => `- ${item.category} — ${item.name} (${item.id}) ${item.price || ''}`).join('\n');
      renderExtraResult('Стоп-лист', list || data);
    } else {
      renderExtraResult('Недоступные позиции', data);
    }
    setStatus('Получены данные о недоступных позициях.', 'ok');
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
  }
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
placeList?.addEventListener('click', (e) => {
  const btn = e.target.closest('.picker-item');
  if (!btn) return;
  const id = btn.dataset.placeId;
  const opt = Array.from(placeSelect.options).find(o => o.value === id);
  if (opt) {
    placeSelect.value = id;
    updateCurrentInfo();
  }
  placeToggle.closest('.picker')?.classList.remove('open');
});
stopListBtn?.addEventListener('click', () => {
  const ids = getSelectedPlaceIds();
  if (!ids.length) return setStatus('Выберите точку для стоп-листа.', 'err');
  ids.forEach(id => runAvailabilityFor(id, true));
  renderStopListPanel();
});
summaryStop?.addEventListener('click', renderStopListPanel);
document.addEventListener('click', (e) => {
  if (!placeToggle?.closest('.picker')) return;
  if (!placeToggle.closest('.picker').contains(e.target)) {
    placeToggle.closest('.picker').classList.remove('open');
  }
});
menuTableBody?.addEventListener('click', (e) => {
  const toggle = e.target.closest('tr[data-toggle]');
  if (toggle) {
    const target = toggle.dataset.toggle;
    const rows = menuTableBody.querySelectorAll(`tr.${target}`);
    rows.forEach(r => r.classList.toggle('hidden'));
    return;
  }
  const img = e.target.closest('.menu-img');
  if (img && img.dataset.full) {
    const index = img.closest('tr')?.dataset?.itemIndex;
    const row = normalizedMenuRows[Number(index)] || null;
    if (row) showDishOverlay(row, img.dataset.full);
  }
});
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
  renderMenuTable(normalizedMenuRows);
  persistSession();
});

toggleDescriptionBtn?.addEventListener('click', () => {
  showDescription = !showDescription;
  toggleDescriptionBtn.textContent = showDescription ? 'Скрыть описание' : 'Показать описание';
  renderMenuTable(normalizedMenuRows);
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
    const table_data = normalizedMenuRows.map(row => ({
      place: row.place || '',
      category: row.category || '',
      name: row.name || '',
      id: row.id || '',
      description: showDescription ? (row.description || '') : '',
      modifiers: showModifiers ? (stripHtml(buildModifiersHtml(row)) || '') : '',
      price: row.price || '',
      available: row.stopList ? 'В стоп-листе' : (row.available ? 'Доступно' : 'Недоступно')
    }));
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
overlayClose?.addEventListener('click', () => overlay?.classList.remove('active'));
overlay?.addEventListener('click', (e) => {
  if (e.target === overlay) overlay.classList.remove('active');
});

if (iikoKeyInput && storedIikoKey && !iikoKeyInput.value) {
  iikoKeyInput.value = storedIikoKey;
}

restoreSession();
if (toggleModifiersBtn) toggleModifiersBtn.textContent = showModifiers ? 'Модификаторы −' : 'Модификаторы +';
if (toggleDescriptionBtn) toggleDescriptionBtn.textContent = showDescription ? 'Скрыть описание' : 'Показать описание';
setStatus('Введите client_id и client_secret для подключения.');
loadIntegrationsList();
if (webhookUrlInput.value && clientIdInput.value && clientSecretInput.value) {
  loadCities();
}
