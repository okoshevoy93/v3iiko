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
const citySelect = document.getElementById('citySelect');
const placeSelect = document.getElementById('placeSelect');
const baseSelect = document.getElementById('baseSelect');
const baseInput = document.getElementById('baseInput');
const addHostBtn = document.getElementById('addHostBtn');
const iikoKeyInput = document.getElementById('iikoKey');
const statusEl = document.getElementById('status');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const cityCount = document.getElementById('cityCount');
const placeCount = document.getElementById('placeCount');
const menuCount = document.getElementById('menuCount');
const menuTableBody = document.getElementById('menuTableBody');
const rawPayload = document.getElementById('rawPayload');
const summaryCategories = document.getElementById('summaryCategories');
const summaryModifiers = document.getElementById('summaryModifiers');
const summaryItems = document.getElementById('summaryItems');
const currentCity = document.getElementById('currentCity');
const currentPlace = document.getElementById('currentPlace');
const placeCard = document.getElementById('placeCard');
const placeIdManual = document.getElementById('placeIdManual');
const extraResult = document.getElementById('extraResult');
const orderStatusInput = document.getElementById('orderStatus');
const ordersHistoryPayloadInput = document.getElementById('ordersHistoryPayload');
const hostDiag = document.getElementById('hostDiag');
const historyView = document.getElementById('historyView');

const btnAvailability = document.getElementById('btnAvailability');
const btnPromos = document.getElementById('btnPromos');
const btnZones = document.getElementById('btnZones');
const btnSchedule = document.getElementById('btnSchedule');
const btnOrders = document.getElementById('btnOrders');
const btnOrdersHistory = document.getElementById('btnOrdersHistory');
const btnOrderDetails = document.getElementById('btnOrderDetails');
const btnLoadRestaurants = document.getElementById('btnLoadRestaurants');

let cachedCities = [];
let cachedPlaces = [];
let iikoOrgs = [];
let yandexPlaces = [];
let lastMenuPayload = null;
let integrations = [];
let cachedSchedule = new Map();
let hostOptions = new Set();
let storedIikoKey = '';

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
  statusDot.classList.toggle('ok', tone === 'ok');
  statusDot.classList.toggle('err', tone === 'err');
  statusText.textContent = tone === 'ok' ? 'Подключено' : tone === 'err' ? 'Ошибка' : 'Не подключено';
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
  if (!client_id || !client_secret) {
    setStatus('Укажите client_id и client_secret.', 'err');
    return null;
  }
  return { client_id, client_secret };
}

function getBase(preferInput = false) {
  const inputVal = baseInput?.value?.trim() || '';
  const selectVal = baseSelect?.value?.trim() || '';
  const base = preferInput && inputVal ? inputVal : inputVal || selectVal;
  return base || 'https://api.eda.yandex.ru';
}

function addHostToList(value, { selectOnly = false } = {}) {
  if (!value) return;
  const host = value.trim().replace(/\/$/, '');
  if (!host) return;
  if (!hostOptions.has(host)) {
    hostOptions.add(host);
    if (baseSelect) {
      const option = document.createElement('option');
      option.value = host;
      option.textContent = host.replace(/^https?:\/\//, '');
      baseSelect.appendChild(option);
    }
  }
  if (!selectOnly) {
    if (baseInput) baseInput.value = host;
    if (baseSelect) baseSelect.value = host;
  }
}

function renderHostDiagnostics(details = []) {
  if (!hostDiag) return;
  if (!details.length) {
    hostDiag.textContent = 'Диагностика недоступна. Укажите хост вручную.';
    return;
  }
  const rows = details.map(d => {
    const status = d.resolvable ? '✅ DNS ок' : `⚠️ ${d.error || 'Не удалось разрешить'}`;
    return `<div class="flex items-start justify-between gap-2"><span class="font-semibold">${d.base}</span><span class="text-right">${status}</span></div>`;
  });
  hostDiag.innerHTML = rows.join('');
}

async function loadHostList() {
  try {
    const data = await apiFetch('/api/yandex/hosts');
    (data.hosts || []).forEach(host => addHostToList(host, { selectOnly: true }));
    renderHostDiagnostics(data.diagnostics || []);
    if (baseSelect && !baseSelect.value && data.hosts?.length) baseSelect.value = data.hosts[0];
    if (!baseInput.value && (baseSelect?.value || data.hosts?.length)) {
      baseInput.value = baseSelect?.value || data.hosts[0];
    }
  } catch (e) {
    renderHostDiagnostics();
    console.error('hosts', e);
  }
}

async function persistHost(host) {
  const value = host?.trim();
  if (!value) return setStatus('Введите хост для сохранения.', 'err');
  addHostToList(value);
  try {
    await apiFetch('/api/yandex/hosts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host: value }),
    });
    setStatus(`Хост ${value} сохранён.`, 'info');
    loadHostList();
  } catch (e) {
    setStatus(e.message || 'Не удалось сохранить хост', 'err');
  }
}

function getWebhookUrl() {
  return webhookUrlInput.value.trim();
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
  const url = new URL(path, window.location.origin);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });
  url.searchParams.set('base', getBase());
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (method !== 'GET' && body) options.body = JSON.stringify({ ...creds, base: getBase(), ...body });
  if (method === 'GET') {
    url.searchParams.set('client_id', creds.client_id);
    url.searchParams.set('client_secret', creds.client_secret);
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
      body: JSON.stringify({ ...creds, base: getBase() }),
    });
    if (data.token) {
      const base = data.base ? ` (хост: ${data.base.replace('https://', '')})` : '';
      setStatus(`Доступ подтверждён${base}. Теперь можно обновить города и загрузить меню.`, 'ok');
    } else {
      setStatus('Не удалось получить токен. Проверьте данные.', 'err');
    }
  } catch (e) {
    setStatus(e.message || 'Ошибка запроса к Yandex Еде', 'err');
  } finally {
    buttonLoading(connectBtn, false);
  }
}

function normalizeCities(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.cities)) return payload.cities;
  if (Array.isArray(payload.items)) return payload.items;
  if (payload.result && Array.isArray(payload.result.cities)) return payload.result.cities;
  return [];
}

function normalizePlaces(payload) {
  if (!payload) return [];
  if (Array.isArray(payload.places)) return payload.places;
  if (Array.isArray(payload.items)) return payload.items;
  if (payload.result && Array.isArray(payload.result.places)) return payload.result.places;
  return [];
}

function normalizeCityName(val) {
  return (val || '').toString().trim();
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

function buildCitiesFromIiko(orgs) {
  const map = new Map();
  (orgs || []).forEach(org => {
    const city = normalizeCityName(org.city || org.address?.city || org.region?.city || org.location?.city || '');
    if (!city) return;
    if (!map.has(city)) map.set(city, { id: city, name: city });
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}

function renderCities(cities) {
  cachedCities = cities;
  citySelect.innerHTML = '<option value="">Выберите город</option>';
  cities.forEach(city => {
    const option = document.createElement('option');
    option.value = city.id || city.city_id || city.slug || city.code || city.name || '';
    option.textContent = city.name || city.title || city.slug || 'Без названия';
    option.dataset.region = city.region || city.region_name || '';
    citySelect.appendChild(option);
  });
  cityCount.textContent = cities.length;
  placeSelect.innerHTML = '<option value="">Выберите точку</option>';
  placeCount.textContent = '0';
  cachedPlaces = [];
  updateCurrentInfo();
}

function renderPlaces(places) {
  cachedPlaces = places;
  placeSelect.innerHTML = '<option value="">Выберите точку</option>';
  places.forEach(place => {
    const option = document.createElement('option');
    const placeId = place.yandexPlaceId || place.id || place.place_id || '';
    option.value = placeId || place.orgId || '';
    const name = place.name || place.title || place.slug || 'Без названия';
    option.textContent = name;
    option.dataset.cityId = place.city_id || place.cityId || place.city || '';
    option.dataset.address = place.address || place.full_address || place.location || place.address_full || '';
    option.dataset.orgId = place.orgId || place.organizationId || '';
    option.dataset.cityName = place.city || place.cityName || '';
    option.dataset.placeId = placeId;
    option.dataset.schedule = JSON.stringify(place.schedule || place.work_time || {});
    placeSelect.appendChild(option);
  });
  placeCount.textContent = places.length;
  updateCurrentInfo();
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
  return list.map(m => m.name || m.title || m.public_name || '').filter(Boolean);
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

function normalizeMenuItems(menuName, menuData) {
  const items = menuData?.items || menuData?.products || menuData?.menu_items || [];
  const categories = buildCategoryMap(menuData);
  const modifiersPool = menuData?.modifiers || menuData?.groupModifiers || [];
  const modifierCount = Array.isArray(modifiersPool) ? modifiersPool.length : 0;

  const mapped = (items || []).map(item => {
    const categoryId = item.category_id || item.group_id || item.categoryId || item.groupId || item.parent_group;
    const categoryName = categories.get(categoryId) || item.category || 'Без категории';
    const modifiers = parseModifiers(item);
    return {
      menu: menuName,
      category: categoryName,
      name: item.name || item.public_name || item.title || 'Без названия',
      id: item.id || item.sku || item.code || item.item_id || '',
      price: parsePrice(item),
      quantity: parseQuantity(item),
      available: item.available ?? item.is_available ?? item.in_stock ?? true,
      stopList: item.available === false || item.is_available === false || item.in_stock === false,
      modifiers,
      modifierCount,
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

function renderIntegrations(list) {
  integrations = list || [];
  integrationSelect.innerHTML = '<option value="">— Не выбрано —</option>';
  integrations.forEach(item => {
    if (item.base_url) addHostToList(item.base_url);
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
  if (baseInput) {
    const host = found.base_url || getBase();
    addHostToList(host);
    baseInput.value = host;
  }
  setStatus(`Интеграция «${found.name}» подставлена. Нажмите «Проверить доступ» и обновите города.`, 'info');
  loadCities({ skipYandex: true });
}

function renderMenu(payload) {
  lastMenuPayload = payload;
  rawPayload.textContent = JSON.stringify(payload || {}, null, 2);
  const menus = collectMenus(payload);
  menuTableBody.innerHTML = '';

  let totalItems = 0;
  let totalModifiers = 0;
  const categorySet = new Set();

  menus.forEach(menu => {
    const rows = normalizeMenuItems(menu.name, menu.data || {});
    rows.forEach(row => {
      categorySet.add(row.category);
      totalModifiers += row.modifiers.length;
      const tr = document.createElement('tr');
      tr.className = `hover:bg-slate-50 ${row.stopList ? 'bg-rose-50/60' : ''}`;
      const stopBadge = row.stopList ? '<span class="stop-pill">Стоп-лист</span>' : '';
      tr.innerHTML = `
        <td class="px-3 py-2 text-slate-800 font-semibold">${row.menu}</td>
        <td class="px-3 py-2">${row.category}</td>
        <td class="px-3 py-2 flex items-center gap-2">${row.name} ${stopBadge}</td>
        <td class="px-3 py-2 text-xs text-slate-500">${row.id}</td>
        <td class="px-3 py-2 text-xs text-slate-600">${row.modifiers.join(', ') || '—'}</td>
        <td class="px-3 py-2 font-semibold">${row.price || '—'}</td>
        <td class="px-3 py-2">${row.quantity === '' ? '—' : row.quantity}</td>
        <td class="px-3 py-2">${row.available ? '<span class="pill green">Доступно</span>' : '<span class="pill red">Стоп-лист</span>'}</td>
      `;
      menuTableBody.appendChild(tr);
    });
    totalItems += rows.length;
  });

  menuCount.textContent = totalItems;
  summaryItems.textContent = `Блюд: ${totalItems}`;
  summaryCategories.textContent = `Категории: ${categorySet.size}`;
  summaryModifiers.textContent = `Модификаторы: ${totalModifiers}`;
}

function updateCurrentInfo() {
  const cityOption = citySelect.options[citySelect.selectedIndex];
  const cityName = cityOption ? cityOption.textContent : '';
  currentCity.innerHTML = citySelect.value
    ? `<span class="pill blue">${cityName}</span>`
    : '<span class="pill blue">Город не выбран</span>';

  const placeOption = placeSelect.options[placeSelect.selectedIndex];
  const placeName = placeOption ? placeOption.textContent : '';
  currentPlace.innerHTML = placeSelect.value
    ? `<span class="pill green">${placeName}</span>`
    : '<span class="pill red">Точка не выбрана</span>';

  renderPlaceCard(placeOption);
}

function renderPlaceCard(placeOption) {
  if (!placeCard) return;
  if (!placeOption || (!placeOption.value && !placeOption.dataset.placeId)) {
    placeCard.innerHTML = 'Выберите точку, чтобы увидеть название ресторана, город, адрес и график.';
    return;
  }
  const cityOption = citySelect.options[citySelect.selectedIndex];
  const cityName = cityOption ? (cityOption.textContent || '') : '';
  const address = placeOption.dataset.address || 'Адрес не указан';
  const scheduleRaw = cachedSchedule.get(placeOption.dataset.placeId || placeOption.value) || JSON.parse(placeOption.dataset.schedule || '{}');
  const schedule = Array.isArray(scheduleRaw?.days)
    ? scheduleRaw.days.map(d => `${d.day || ''}: ${d.from || d.start || ''} — ${d.to || d.end || ''}`).join('<br>')
    : 'График не указан';
  const hint = placeOption.dataset.placeId ? '' : '<div class="text-[11px] text-amber-600 mt-1">Для вызовов Yandex укажите place_id вручную или выберите совпадение.</div>';
  placeCard.innerHTML = `
    <div class="space-y-1">
      <div class="text-sm font-semibold text-slate-800">${placeOption.textContent || 'Без названия'}</div>
      <div class="text-xs text-slate-600">Город: ${cityName || '—'}</div>
      <div class="text-xs text-slate-600">Адрес: ${address}</div>
      <div class="text-xs text-slate-600">График: <br>${schedule}</div>
      ${hint}
    </div>
  `;
}

async function loadScheduleForPlace(placeId) {
  if (!placeId) return;
  try {
    const data = await callYandex('/api/yandex/schedule', { params: { place_id: placeId } });
    const schedule = data?.schedule || data?.items || data;
    cachedSchedule.set(placeId, schedule);
    const option = placeSelect.options[placeSelect.selectedIndex];
    renderPlaceCard(option);
  } catch (e) {
    console.warn('schedule', e.message || e);
  }
}

async function loadCities({ skipYandex = false } = {}) {
  const creds = getCreds();
  if (!creds) return;
  const iikoKey = (iikoKeyInput?.value?.trim()) || storedIikoKey;
  if (iikoKeyInput && !iikoKeyInput.value) iikoKeyInput.value = iikoKey;
  if (iikoKey) syncStoredIikoKey(iikoKey);
  if (!iikoKey) {
    setStatus('Укажите API-ключ iiko, чтобы загрузить города и точки.', 'err');
    return;
  }
  buttonLoading(loadCitiesBtn, true, 'Загружаем города...');
  try {
    const iikoPromise = apiFetch('/api/iiko/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: iikoKey }),
    });

    let yandexData = null;
    let yandexError = null;
    if (!skipYandex) {
      try {
        yandexData = await callYandex('/api/yandex/restaurants');
      } catch (e) {
        yandexError = e;
      }
    }

    const iikoData = await iikoPromise;
    iikoOrgs = Array.isArray(iikoData?.organizations) ? iikoData.organizations : (iikoData?.items || []);
    yandexPlaces = normalizePlaces(yandexData);
    const cities = buildCitiesFromIiko(iikoOrgs);
    renderCities(cities);

    if (yandexError) {
      setStatus(`Города iiko загружены (${cities.length}). Yandex ответил ошибкой: ${yandexError.message}`, 'err');
    } else {
      setStatus(`Найдено городов iiko: ${cities.length}, заведений Yandex: ${yandexPlaces.length || 0}.`, 'ok');
    }
  } catch (e) {
    setStatus(e.message || 'Не удалось получить города', 'err');
  } finally {
    buttonLoading(loadCitiesBtn, false);
  }
}

async function loadPlaces() {
  const creds = getCreds();
  if (!creds) return;
  const cityId = citySelect.value;
  const cityName = citySelect.options[citySelect.selectedIndex]?.textContent || '';
  buttonLoading(placeSelect, true, '');
  try {
    if (!iikoOrgs.length) {
      await loadCities();
    }
    const filtered = iikoOrgs.filter(org => normalizeCityName(org.city || org.address?.city || org.region?.city || '') === normalizeCityName(cityId || cityName));
    const places = filtered.map(org => {
      const matched = findYandexPlace(org) || {};
      return {
        id: matched.id || matched.place_id || '',
        yandexPlaceId: matched.id || matched.place_id || '',
        name: org.name || org.organizationName || org.title || 'Без названия',
        city: org.city || org.address?.city || cityName,
        address: org.address?.full || org.address?.street || org.address?.line1 || org.address || matched.address,
        orgId: org.id || org.organizationId || org.uuid,
        schedule: matched.schedule,
      };
    });
    renderPlaces(places);
    setStatus(`Мест в городе: ${places.length}.`, 'ok');
  } catch (e) {
    setStatus(e.message || 'Не удалось получить места', 'err');
  } finally {
    buttonLoading(placeSelect, false);
  }
}

async function loadMenu() {
  const creds = getCreds();
  if (!creds) return;
  const placeId = getActivePlaceId();
  if (!placeId) {
    setStatus('Выберите точку (place), чтобы загрузить меню.', 'err');
    return;
  }
  buttonLoading(loadMenuBtn, true, 'Загружаем меню...');
  try {
    const params = new URLSearchParams({ ...creds, place_id: placeId, base: getBase() }).toString();
    const data = await apiFetch(`/api/yandex/menu?${params}`);
    renderMenu(data);
    setStatus('Меню загружено.', 'ok');
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
        base_url: getBase(),
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

async function runAvailability() {
  const placeId = getActivePlaceId();
  if (!placeId) return setStatus('Укажите place_id (выберите точку или заполните поле).', 'err');
  try {
    const data = await callYandex('/api/yandex/availability', { params: { place_id: placeId } });
    renderExtraResult('Недоступные позиции', data);
    setStatus('Получены данные о недоступных позициях.', 'ok');
  } catch (e) {
    setStatus(e.message || 'Не удалось получить availability', 'err');
  }
}

async function runPromos() {
  const placeId = getActivePlaceId();
  if (!placeId) return setStatus('Укажите place_id (выберите точку или заполните поле).', 'err');
  try {
    const data = await callYandex('/api/yandex/promos', { params: { place_id: placeId } });
    renderExtraResult('Акционные позиции', data);
    setStatus('Акции получены.', 'ok');
  } catch (e) {
    setStatus(e.message || 'Не удалось получить акции', 'err');
  }
}

async function runZones() {
  const placeId = getActivePlaceId();
  if (!placeId) return setStatus('Укажите place_id (выберите точку или заполните поле).', 'err');
  try {
    const data = await callYandex('/api/yandex/delivery_zones', { params: { place_id: placeId } });
    renderExtraResult('Зоны доставки', data);
    setStatus('Зоны доставки получены.', 'ok');
  } catch (e) {
    setStatus(e.message || 'Не удалось получить зоны доставки', 'err');
  }
}

async function runSchedule() {
  const placeId = getActivePlaceId();
  if (!placeId) return setStatus('Укажите place_id (выберите точку или заполните поле).', 'err');
  try {
    const data = await callYandex('/api/yandex/schedule', { params: { place_id: placeId } });
    renderExtraResult('График работы', data);
    setStatus('График получен.', 'ok');
  } catch (e) {
    setStatus(e.message || 'Не удалось получить график', 'err');
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
    renderExtraResult('Список ресторанов', data);
    setStatus('Рестораны получены.', 'ok');
  } catch (e) {
    setStatus(e.message || 'Не удалось получить рестораны', 'err');
  }
}

connectBtn.addEventListener('click', verifyAccess);
loadCitiesBtn.addEventListener('click', loadCities);
loadMenuBtn.addEventListener('click', loadMenu);
citySelect.addEventListener('change', () => {
  updateCurrentInfo();
  if (citySelect.value) {
    loadPlaces();
  } else {
    renderPlaces([]);
  }
});
placeSelect.addEventListener('change', () => {
  updateCurrentInfo();
  const option = placeSelect.options[placeSelect.selectedIndex];
  const placeId = option?.dataset?.placeId || '';
  if (placeId) {
    placeIdManual.value = placeId;
    loadScheduleForPlace(placeId);
  } else {
    placeIdManual.value = '';
    setStatus('У выбранной точки нет связанного place_id. Укажите вручную.', 'info');
  }
});
integrationSelect.addEventListener('change', () => {
  if (integrationSelect.value) {
    applyIntegration(integrationSelect.value);
  }
});
btnAvailability?.addEventListener('click', runAvailability);
btnPromos?.addEventListener('click', runPromos);
btnZones?.addEventListener('click', runZones);
btnSchedule?.addEventListener('click', runSchedule);
btnOrders?.addEventListener('click', runOrders);
btnOrdersHistory?.addEventListener('click', runOrdersHistory);
iikoKeyInput?.addEventListener('change', (e) => syncStoredIikoKey(e.target.value.trim()));
btnOrderDetails?.addEventListener('click', runOrderDetails);
btnLoadRestaurants?.addEventListener('click', runRestaurants);
saveIntegrationBtn.addEventListener('click', saveIntegration);
deleteIntegrationBtn.addEventListener('click', deleteIntegration);
addHostBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  persistHost(getBase(true));
});

baseSelect?.addEventListener('change', () => {
  const selected = baseSelect.value;
  if (selected && baseInput) baseInput.value = selected;
});

if (baseInput && !baseInput.value) {
  baseInput.value = 'https://eda-api.yandex.ru';
}

if (iikoKeyInput && storedIikoKey && !iikoKeyInput.value) {
  iikoKeyInput.value = storedIikoKey;
}

setStatus('Введите client_id и client_secret для подключения.');
loadIntegrationsList();
loadHostList();
