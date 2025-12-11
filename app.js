/* JS для iiko Menu Web */

// === DOM-элементы ===
const apiKeyInput          = document.getElementById('apiKey');
const loadOrgsBtn          = document.getElementById('loadOrgsBtn');
const logoutBtn            = document.getElementById('logoutBtn');
const statusEl             = document.getElementById('status');
const apiStatusDot         = document.getElementById('apiStatusDot');
const apiStatusText        = document.getElementById('apiStatusText');

const orgsListEl           = document.getElementById('orgsList');
const selectAllCitiesBtn   = document.getElementById('selectAllCities');
const clearCitiesBtn       = document.getElementById('clearCities');
const citySearchInput      = document.getElementById('citySearch');
const cityColumnEl         = document.getElementById('cityColumn');
const cityToggleBar        = document.getElementById('cityToggleBar');

const menuSelectEl         = document.getElementById('menuSelect');

const priceCategoryLabel   = document.getElementById('priceCategoryLabel');
const priceCategorySingle  = document.getElementById('priceCategorySingle');
const pcSingleWrapper      = document.getElementById('pcSingleWrapper');
const pcSingleChips        = document.getElementById('pcSingleChips');
const pcMultiWrapper       = document.getElementById('pcMultiWrapper');
const pcMultiChips         = document.getElementById('pcMultiChips');

const modeOrgsAllBtn       = document.getElementById('modeOrgsAllBtn');
const modeOrgsBtn          = document.getElementById('modeOrgsBtn');
const modePriceCatsBtn     = document.getElementById('modePriceCatsBtn');
const modeSelectionBtn     = document.getElementById('modeSelectionBtn');

const loadMenuBtn          = document.getElementById('loadMenuBtn');
const loadImagesBtn        = document.getElementById('loadImagesBtn');
const exportBtn            = document.getElementById('exportBtn');

const menuTheadEl          = document.getElementById('menuThead');
const menuTbodyEl          = document.getElementById('menuTbody');
const tableInfoEl          = document.getElementById('tableInfo');

const fontSmallerBtn       = document.getElementById('fontSmaller');
const fontBiggerBtn        = document.getElementById('fontBigger');
const toggleDescriptionBtn = document.getElementById('toggleDescriptionBtn');
const menuTableEl          = document.getElementById('menuTable');

const mobileCityBtn        = document.getElementById('mobileCityBtn');
const mobileCityBadge      = document.getElementById('mobileCityBadge');
const cityModal            = document.getElementById('cityModal');
const cityModalList        = document.getElementById('cityModalList');
const cityModalSearch      = document.getElementById('cityModalSearch');
const closeCityModal       = document.getElementById('closeCityModal');
const cityModalApply       = document.getElementById('cityModalApply');
const cityModalCount       = document.getElementById('cityModalCount');
const cityModalBackdrop    = document.getElementById('cityModalBackdrop');
const cityModalFooter      = document.getElementById('cityModalFooter');
const cityModalSelectAll   = document.getElementById('cityModalSelectAll');
const cityModalClear       = document.getElementById('cityModalClear');
const resetAllBtn          = document.getElementById('resetAllBtn');

const imageModal           = document.getElementById('imageModal');
const imageModalImg        = document.getElementById('imageModalImg');
const imageModalTitle      = document.getElementById('imageModalTitle');
const imageModalSku        = document.getElementById('imageModalSku');
const closeImageModalBtn   = document.getElementById('closeImageModal');
const checkImageBtn        = document.getElementById('checkImageBtn');
const imageModalBody       = document.getElementById('imageModalBody');
const imageModalStatus     = document.getElementById('imageModalStatus');
const imageModalDescription= document.getElementById('imageModalDescription');

const priceFilterGroup     = document.getElementById('priceFilterGroup');
const filterAnyPriceBtn    = document.getElementById('filterAnyPriceBtn');

const selectionToolsGroup    = document.getElementById('selectionToolsGroup');
const openSelectionSearchBtn = document.getElementById('openSelectionSearchBtn');
const clearSelectionBtn      = document.getElementById('clearSelectionBtn');

const tableScrollContainer = document.getElementById('tableScrollContainer');
const tableActionBar       = document.getElementById('tableActionBar');
const mobileSelectAllRowsBtn   = document.getElementById('mobileSelectAllRows');
const mobileClearRowSelectionBtn = document.getElementById('mobileClearRowSelection');

const dishSearchModal      = document.getElementById('dishSearchModal');
const dishSearchInput      = document.getElementById('dishSearchInput');
const dishSearchResultsEl  = document.getElementById('dishSearchResults');
const closeDishSearchBtn   = document.getElementById('closeDishSearchBtn');

const rowContextMenu       = document.getElementById('rowContextMenu');
const ctxAddToSelectionBtn = document.getElementById('ctxAddToSelectionBtn');
const ctxCopyValueBtn      = document.getElementById('ctxCopyValueBtn');


// === Состояние ===
let organizations = [];
let externalMenus = [];
let priceCategories = [];

let selectedOrgIds = new Set();

let viewMode = 'orgsAll';           // orgsAll | orgs | priceCats | selection
let currentMenuId = null;
let currentPriceCategoryId = null;

let selectedPcIdsMulti = new Set(); // для orgsAll / priceCats / selection (чипы)

let allItems = [];                  // текущие строки таблицы
let tableColumnLabels = [];         // подписи колонок (ЦК)
let tableColumnKeys = [];           // ключи (id ЦК / orgId)

let collapsedCities = new Set();
let collapsedCategories = new Set();

let modeSelection = {
  orgsAll:   new Set(),
  orgs:      new Set(),
  priceCats: new Set(),
  selection: new Set()
};

let modeState = {
  orgsAll:   { loaded: false, items: [], labels: [], keys: [] },
  orgs:      { loaded: false, items: [], labels: [], keys: [] },
  priceCats: { loaded: false, items: [], labels: [], keys: [], orgId: null },
  selection: { loaded: false, items: [], labels: [], keys: [] }
};

let filterCategoryInput = null;
let filterNameInput     = null;
let filterCodeInput     = null;

let currentFontSize = 16;
let apiConnected = false;

let citySearchTerm = '';
let cityModalSelection = new Set();
let isCityModalOpen = false;

let filterCategoryActive = '';
let filterNameActive     = '';
let filterCodeActive     = '';

let filterPerPc   = {}; // { columnKey: boolean }
let filterAnyPrice = false;

let imageVersion = 1;
let lastMenuPayload = null;

const selectionItems = new Map();   // key: "code|size", value: {code,name,externalName,categoryPath,sizeName,imageUrl}

let menuSearchIndex = [];           // массив для быстрого поиска
let menuSearchIndexMap = new Map(); // key -> row в индексе

let ctxLastItemKey = null;
let ctxCopyText    = '';
let ctxCopyLabel   = '';

let selectedRowKeys = new Set();
let lastSelectedRowKey = null;

let theadControlsBound = false;
let showDescriptionColumn = false;

let SESSION_KEY = 'iikoMenuWebSession';
let currentUserName = '';
const INDEX_SESSION_FLAG = 'indexSessionAlive';
const isFreshIndexSession = (() => {
  try {
    const seen = sessionStorage.getItem(INDEX_SESSION_FLAG);
    if (!seen) sessionStorage.setItem(INDEX_SESSION_FLAG, '1');
    return !seen;
  } catch (e) {
    return false;
  }
})();
const DEFAULT_PC_NAME = 'Базовая категория';
const LAZY_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"%3E%3Crect width="64" height="64" rx="8" fill="%23e5e7eb"/%3E%3C/svg%3E';
const NO_PHOTO_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"%3E%3Crect width="1200" height="800" fill="%232d3748"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23e5e7eb" font-size="64" font-family="Arial, sans-serif"%3EНет фото%3C/text%3E%3C/svg%3E';
let lazyObserver = null;
let restoredSession = null;
let horizontalDrag = { active: false, startX: 0, scrollLeft: 0, target: null };

function getCurrentPriceCategoryName() {
  if (!currentPriceCategoryId) return '';
  const found = priceCategories.find(p => p.id === currentPriceCategoryId);
  return found ? (found.name || '') : '';
}

function getBasePriceCategoryId() {
  const basePc = priceCategories.find(pc => (pc.name || '').toLowerCase() === DEFAULT_PC_NAME.toLowerCase());
  if (basePc) return basePc.id;
  return priceCategories.length ? priceCategories[0].id : null;
}

function syncImageButtonAvailability() {
  if (!loadImagesBtn) return;
  const hasItems = !!(allItems && allItems.length);
  const hasMenuRef = !!(currentMenuId || (lastMenuPayload && lastMenuPayload.payload && lastMenuPayload.payload.externalMenuId));
  loadImagesBtn.disabled = !(hasItems && hasMenuRef);
}

function syncTableHeaderOffset() {
  if (!tableScrollContainer || !menuTableEl) return;
  const headerEl = document.querySelector('.header');
  const containerRect = tableScrollContainer.getBoundingClientRect();
  const headerRect = headerEl ? headerEl.getBoundingClientRect() : { bottom: 0, height: 0 };
  const shouldStick = containerRect.top <= headerRect.bottom && containerRect.bottom > headerRect.bottom;
  const offset = shouldStick ? Math.max(0, headerRect.bottom - containerRect.top) : 0;
  tableScrollContainer.style.setProperty('--table-head-offset', `${offset}px`);
  menuTableEl.classList.toggle('head-sticky', shouldStick);
}
let imageModalState = { list: [], index: 0 };
let imageIndexMap = new Map();

// === Утилиты ===
function escapeHtml(str) {
  return (str || '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegExp(str) {
  return (str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightMatch(text, query) {
  const t = (text || '').toString();
  const q = (query || '').trim();
  if (!q) return escapeHtml(t);
  const re = new RegExp(escapeRegExp(q), 'ig');
  return escapeHtml(t).replace(
    re,
    m => `<mark class="bg-amber-500/40 text-amber-900">${m}</mark>`
  );
}

async function bootstrapUserKey() {
  try {
    const resp = await fetch('/api/me');
    if (!resp.ok) throw new Error('auth');
    const data = await resp.json();
    currentUserName = data.user || '';
    if (currentUserName) {
      SESSION_KEY = `iikoMenuWebSession_${currentUserName}`;
    }
  } catch (e) {
    console.warn('Не удалось получить пользователя', e);
  } finally {
    restoredSession = isFreshIndexSession ? null : loadSessionSnapshot();
  }
}

function keysInOrder(mapObj) {
  return Array.from(mapObj.keys());
}

function bindHorizontalScroll(el) {
  if (!el) return;
  el.addEventListener('wheel', (e) => {
    const horizontalDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY)
      ? e.deltaX
      : (e.shiftKey ? e.deltaY : 0);
    if (!horizontalDelta) return;
    const factor = Math.abs(horizontalDelta) > 30 ? 0.85 : 0.8;
    el.scrollLeft += horizontalDelta * factor;
  }, { passive: true });
}

function bindPointerPan(el) {
  if (!el) return;
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType !== 'touch') return;
    if (e.target.closest('button, a, input, select, textarea, label, [role="button"], [data-no-pan], img')) return;
    horizontalDrag = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
      target: el,
      moved: false
    };
    el.setPointerCapture(e.pointerId);
    el.classList.add('cursor-grabbing');
  });

  el.addEventListener('pointermove', (e) => {
    if (!horizontalDrag.active || horizontalDrag.target !== el) return;
    const dx = (e.clientX - horizontalDrag.startX) * 1.03;
    const dy = (e.clientY - horizontalDrag.startY) * 1.03;
    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) horizontalDrag.moved = true;
    el.scrollLeft = horizontalDrag.scrollLeft - dx;
    el.scrollTop  = horizontalDrag.scrollTop - dy;
    if (horizontalDrag.moved) e.preventDefault();
  });

  const stopPan = (e) => {
    if (horizontalDrag.active && horizontalDrag.target === el) {
      horizontalDrag.active = false;
      try { el.releasePointerCapture(e.pointerId); } catch (_) {}
      el.classList.remove('cursor-grabbing');
    }
  };

  el.addEventListener('pointerup', stopPan);
  el.addEventListener('pointercancel', stopPan);
  el.addEventListener('pointerleave', stopPan);
}

function setApiStatus(connected) {
  apiConnected = connected;
  if (connected) {
    apiStatusDot.classList.remove('bg-slate-500');
    apiStatusDot.classList.add('bg-emerald-500');
    apiStatusText.textContent = 'Подключено к iiko';
  } else {
    apiStatusDot.classList.remove('bg-emerald-500');
    apiStatusDot.classList.add('bg-slate-500');
    apiStatusText.textContent = 'Не подключено';
  }
}

function setStatus(text, type = 'info') {
  if (text && text.includes('Организаций')) {
    const dishCount = selectionItems ? selectionItems.size : 0;
    text = `${text} • Блюд в выборке: ${dishCount}`;
  }
  statusEl.textContent = text;
  statusEl.classList.remove('text-red-400', 'text-emerald-400');
  if (type === 'error')  statusEl.classList.add('text-red-400');
  if (type === 'success') statusEl.classList.add('text-emerald-400');
}

function loadSessionSnapshot() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Не удалось восстановить сессию', e);
    return null;
  }
}

function restoreFromCacheSnapshot(snapshot) {
  if (!snapshot || !snapshot.cacheData) return false;

  try {
    const cache = snapshot.cacheData;
    organizations   = Array.isArray(cache.organizations) ? cache.organizations : [];
    externalMenus   = Array.isArray(cache.externalMenus) ? cache.externalMenus : [];
    priceCategories = Array.isArray(cache.priceCategories) ? cache.priceCategories : [];

    const table = cache.table || {};
    allItems = Array.isArray(table.items) ? table.items : [];
    tableColumnLabels = Array.isArray(table.labels) ? table.labels : [];
    tableColumnKeys   = Array.isArray(table.keys) ? table.keys : [];

    collapsedCities = new Set(cache.collapsedCities || []);
    collapsedCategories = new Set(cache.collapsedCategories || []);

    if (cache.modeState) {
      modeState = {
        orgsAll:   cache.modeState.orgsAll   || { loaded: false, items: [], labels: [], keys: [] },
        orgs:      cache.modeState.orgs      || { loaded: false, items: [], labels: [], keys: [] },
        priceCats: cache.modeState.priceCats || { loaded: false, items: [], labels: [], keys: [], orgId: null },
        selection: cache.modeState.selection || { loaded: false, items: [], labels: [], keys: [] }
      };
    }

    return true;
  } catch (e) {
    console.warn('Не удалось восстановить данные из кеша', e);
    return false;
  }
}

function saveSessionSnapshot() {
  try {
    const serializedModeState = {
      orgsAll:   modeState.orgsAll ? { ...modeState.orgsAll, keys: modeState.orgsAll.keys || [], labels: modeState.orgsAll.labels || [], items: modeState.orgsAll.items || [] } : { loaded: false, items: [], labels: [], keys: [] },
      orgs:      modeState.orgs ? { ...modeState.orgs, keys: modeState.orgs.keys || [], labels: modeState.orgs.labels || [], items: modeState.orgs.items || [] } : { loaded: false, items: [], labels: [], keys: [] },
      priceCats: modeState.priceCats ? { ...modeState.priceCats, keys: modeState.priceCats.keys || [], labels: modeState.priceCats.labels || [], items: modeState.priceCats.items || [] } : { loaded: false, items: [], labels: [], keys: [], orgId: null },
      selection: modeState.selection ? { ...modeState.selection, keys: modeState.selection.keys || [], labels: modeState.selection.labels || [], items: modeState.selection.items || [] } : { loaded: false, items: [], labels: [], keys: [] }
    };

    const snapshot = {
      selectedOrgIds: Array.from(selectedOrgIds),
      viewMode,
      currentMenuId,
      currentPriceCategoryId,
      selectedPcIdsMulti: Array.from(selectedPcIdsMulti),
      filterCategoryActive,
      filterNameActive,
      filterCodeActive,
      filterAnyPrice,
      filterPerPc,
      showDescriptionColumn,
      currentFontSize,
      selectionItems: Array.from(selectionItems.entries()),
      modeSelection: {
        orgsAll: Array.from(modeSelection.orgsAll || []),
        orgs: Array.from(modeSelection.orgs || []),
        priceCats: Array.from(modeSelection.priceCats || []),
        selection: Array.from(modeSelection.selection || [])
      },
      cacheData: {
        organizations,
        externalMenus,
        priceCategories,
        modeState: serializedModeState,
        table: {
          items: allItems,
          labels: tableColumnLabels,
          keys: tableColumnKeys
        },
        collapsedCities: Array.from(collapsedCities),
        collapsedCategories: Array.from(collapsedCategories)
      }
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(snapshot));
  } catch (e) {
    console.warn('Не удалось сохранить сессию', e);
  }
}

function clearSessionStorage() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.warn('Не удалось очистить localStorage', e);
  }
}

function ensureLazyObserver() {
  if (lazyObserver) return;
  lazyObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      const realSrc = img.dataset.lazySrc;
      if (realSrc) {
        img.src = realSrc;
        img.removeAttribute('data-lazy-src');
      }
      lazyObserver.unobserve(img);
    });
  }, { rootMargin: '120px' });
}

function registerLazyImage(img, realSrc) {
  if (!img || !realSrc) return;
  img.dataset.lazySrc = realSrc;
  img.src = LAZY_PLACEHOLDER;
  img.loading = 'lazy';
  ensureLazyObserver();
  lazyObserver.observe(img);
}

function applyFontSize() {
  if (menuTableEl) menuTableEl.style.fontSize = currentFontSize + 'px';
}

function getButtonSpans(btn) {
  const labelSpan   = btn.querySelector('.btn-label');
  const percentSpan = btn.querySelector('.btn-percent');
  return { labelSpan, percentSpan };
}

function startButtonLoading(btn, baseLabel) {
  const { labelSpan, percentSpan } = getButtonSpans(btn);
  const defaultLabel = btn.getAttribute('data-default-label') || '';
  if (labelSpan) labelSpan.textContent = baseLabel || defaultLabel || 'Загрузка';
  if (percentSpan) percentSpan.textContent = '0%';
  btn.classList.add('loading');
  btn.style.setProperty('--progress', 0);
  btn.disabled = true;
}

function setButtonProgress(btn, fraction) {
  const { percentSpan } = getButtonSpans(btn);
  const f = Math.max(0, Math.min(1, fraction));
  btn.style.setProperty('--progress', f);
  if (percentSpan) percentSpan.textContent = `${Math.round(f * 100)}%`;
}

function finishButtonLoading(btn) {
  const { labelSpan, percentSpan } = getButtonSpans(btn);
  const defaultLabel = btn.getAttribute('data-default-label') || '';
  btn.style.setProperty('--progress', 1);
  setTimeout(() => {
    if (labelSpan && defaultLabel) labelSpan.textContent = defaultLabel;
    if (percentSpan) percentSpan.textContent = '';
    btn.classList.remove('loading');
    btn.style.removeProperty('--progress');
    btn.disabled = false;
  }, 200);
}

async function callBackend(endpoint, version, payload = {}) {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) throw new Error('Укажите apiLogin (ключ iiko)');
  try {
    localStorage.setItem('iikoApiLogin', apiKey);
  } catch (e) {
    console.warn('localStorage unavailable', e);
  }

  const ep = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  const res = await fetch('/api/proxy', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      api_key: apiKey,
      endpoint: ep,
      version: Number(version),
      payload
    })
  });

  const json = await res.json();
  if (!res.ok) {
    const msg = json && json.error ? json.error : `Ошибка ${res.status}`;
    throw new Error(msg);
  }
  if (json && json.error) throw new Error(json.error);
  setApiStatus(true);
  return json;
}

// === Организации (города) ===
function getOrgCityName(org) {
  if (org.address && org.address.city) return org.address.city;
  if (org.city) return org.city;
  if (org.region) return org.region;
  if (org.countryName) return org.countryName;
  return '';
}

function filterOrganizationsBySearch() {
  const search = (citySearchTerm || '').toLowerCase();
  if (!search) return organizations;
  return organizations.filter(org => {
    const name = (org.name || '').toLowerCase();
    const cityName = getOrgCityName(org).toLowerCase();
    const combined = (name + ' ' + cityName).trim().toLowerCase();
    return combined.includes(search);
  });
}

function createCityRow(org, selectionSet, onToggle) {
  const div = document.createElement('div');
  div.className = 'city-item px-3 py-2 flex flex-col gap-0.5';
  div.dataset.id = org.id;
  const fullName = `${org.name || ''}${getOrgCityName(org) ? ' — ' + getOrgCityName(org) : ''}`.trim();
  if (fullName) div.title = fullName;

  const title = document.createElement('div');
  title.className = 'city-title';
  title.textContent = org.name;

  const city = document.createElement('div');
  city.className = 'city-sub';
  city.textContent = getOrgCityName(org) || '';

  div.appendChild(title);
  div.appendChild(city);

  if (selectionSet.has(org.id)) div.classList.add('selected');

  div.addEventListener('click', () => {
    onToggle(org.id, div);
  });

  return div;
}

function renderCityContainer(container, source, selectionSet, onToggle) {
  if (!container) return;
  container.innerHTML = '';

  if (!source.length) {
    container.innerHTML = '<div class="text-xs text-slate-500">Города не найдены</div>';
    return;
  }

  source.forEach(org => {
    container.appendChild(createCityRow(org, selectionSet, onToggle));
  });
}

function renderOrganizations() {
  const filtered = filterOrganizationsBySearch();

  renderCityContainer(orgsListEl, filtered, selectedOrgIds, (id, el) => {
    if (selectedOrgIds.has(id)) {
      selectedOrgIds.delete(id);
      el.classList.remove('selected');
    } else {
      selectedOrgIds.add(id);
      el.classList.add('selected');
    }
    modeSelection[viewMode] = new Set(selectedOrgIds);
    updateCitySelectionView();
  });

  if (cityModalList) {
    if (isCityModalOpen) {
      renderCityContainer(cityModalList, filtered, cityModalSelection, (id, el) => {
        if (cityModalSelection.has(id)) {
          cityModalSelection.delete(id);
          el.classList.remove('selected');
        } else {
          cityModalSelection.add(id);
          el.classList.add('selected');
        }
        updateCityModalFooter();
      });
    } else {
      cityModalList.innerHTML = '';
    }
  }

  updateCitySelectionView(false);
  if (isCityModalOpen) {
    updateCityModalFooter();
    handleCityModalScroll();
  }
}

function updateCitySelectionView(shouldSave = true) {
  const nodes = orgsListEl.querySelectorAll('.city-item');
  nodes.forEach(el => {
    const id = el.dataset.id;
    if (selectedOrgIds.has(id)) el.classList.add('selected');
    else el.classList.remove('selected');
  });
  updateTableInfo();
  updateMobileCityBtn();
  if (shouldSave) saveSessionSnapshot();
}

function updateMobileCityBtn() {
  if (!mobileCityBtn) return;
  const count = selectedOrgIds.size || 0;
  if (mobileCityBadge) {
    mobileCityBadge.textContent = count;
    if (count === 0) {
      mobileCityBadge.style.backgroundColor = '#fca5a5';
      mobileCityBadge.style.color = '#991b1b';
    } else {
      mobileCityBadge.style.backgroundColor = '#0284c7';
      mobileCityBadge.style.color = '#ffffff';
    }
  }
  const label = mobileCityBtn.querySelector('span');
  if (label) label.textContent = 'Города';
}

function updateCityModalFooter() {
  if (!cityModalCount) return;
  const count = cityModalSelection.size || 0;
  cityModalCount.textContent = `Выбрано: ${count}`;
}

function revealCityFooter() {
  if (!cityModalFooter) return;
  requestAnimationFrame(() => cityModalFooter.classList.add('visible'));
}

function hideCityFooter() {
  if (!cityModalFooter) return;
  cityModalFooter.classList.remove('visible');
}

function handleCityModalScroll() {
  if (!cityModalList || !cityModalFooter) return;
  const nearBottom = cityModalList.scrollTop + cityModalList.clientHeight >= cityModalList.scrollHeight - 24;
  const moved = cityModalList.scrollTop > 8;
  const shouldShow = nearBottom || moved || cityModalFooter.classList.contains('visible');
  cityModalFooter.classList.toggle('visible', shouldShow);
}

function openCityModal() {
  if (!cityModal) return;
  isCityModalOpen = true;
  cityModalSelection = new Set(selectedOrgIds);
  updateCityModalFooter();
  if (cityModalSearch) cityModalSearch.value = citySearchTerm;
  renderOrganizations();
  cityModal.classList.remove('hidden');
  revealCityFooter();
}

function closeCityModalWindow() {
  isCityModalOpen = false;
  cityModal.classList.add('hidden');
  cityModalSelection = new Set();
  hideCityFooter();
}

function selectAllCities() {
  selectedOrgIds = new Set(organizations.map(o => o.id));
  modeSelection[viewMode] = new Set(selectedOrgIds);
  if (isCityModalOpen) {
    cityModalSelection = new Set(selectedOrgIds);
    updateCityModalFooter();
  }
  updateCitySelectionView();
}

function clearCities() {
  selectedOrgIds.clear();
  modeSelection[viewMode] = new Set();
  if (isCityModalOpen) {
    cityModalSelection = new Set();
    updateCityModalFooter();
    if (cityModalList) {
      cityModalList.querySelectorAll('.city-item').forEach(el => el.classList.remove('selected'));
    }
  }
  updateCitySelectionView();
}

function syncCityColumnVisibility() {
  const isNarrow = window.innerWidth <= 1440;
  if (isNarrow) {
    if (cityColumnEl) cityColumnEl.style.display = 'none';
    cityColumnEl?.classList.add('hidden');
    cityToggleBar?.classList.remove('hidden');
  } else {
    if (cityColumnEl) cityColumnEl.style.display = '';
    cityColumnEl?.classList.remove('hidden');
    cityToggleBar?.classList.add('hidden');
  }
}

function mapOrgsToCityNames(orgIds) {
  const names = [];
  orgIds.forEach(id => {
    const org = organizations.find(o => o.id === id);
    if (!org) return;
    let city = '';
    if (org.address && org.address.city) city = org.address.city;
    else if (org.city) city = org.city;
    else if (org.region) city = org.region;
    else if (org.countryName) city = org.countryName;

    names.push(city ? `${city} — ${org.name}` : org.name);
  });
  return names;
}

function buildCityOrderMap() {
  const map = new Map();
  organizations.forEach((org, idx) => {
    const label = mapOrgsToCityNames([org.id])[0] || 'Город не указан';
    if (!map.has(label)) map.set(label, idx);
  });
  return map;
}

// === Меню и ЦК ===
function renderMenus(desiredId = null) {
  menuSelectEl.innerHTML = '';
  currentMenuId = null;

  if (!externalMenus.length) {
    menuSelectEl.innerHTML = '<option value="">Нет внешних меню</option>';
    return;
  }

  const placeholder = new Option('Выберите меню', '', false, false);
  menuSelectEl.appendChild(placeholder);

  externalMenus.forEach((m, idx) => {
    const opt = new Option(m.name || m.id, m.id, false, false);
    menuSelectEl.appendChild(opt);
  });

  const firstId = externalMenus[0]?.id || '';
  const targetId = desiredId && externalMenus.some(m => m.id === desiredId)
    ? desiredId
    : firstId;

  if (targetId) {
    menuSelectEl.value = targetId;
    currentMenuId = targetId;
    saveSessionSnapshot();
  }
}

function handleMenuChange() {
  const val = menuSelectEl.value;
  currentMenuId = val || null;
  saveSessionSnapshot();
}

function normalizePriceCategories(raw) {
  const map = new Map();
  (raw || []).forEach(pc => {
    if (!pc || !pc.id) return;
    if (!map.has(pc.id)) map.set(pc.id, pc);
  });
  return Array.from(map.values());
}

function renderPriceCategoriesSingle() {
  priceCategorySingle.innerHTML = '';
  if (!priceCategories.length) {
    priceCategorySingle.innerHTML = '<option value="">Ценовые категории не настроены</option>';
    return;
  }
  priceCategorySingle.appendChild(new Option('Выберите ЦК', '', true, false));
  priceCategories.forEach(pc => {
    priceCategorySingle.appendChild(new Option(pc.name || pc.id, pc.id));
  });
}

function renderPcSingle() {
  pcSingleChips.innerHTML = '';

  if (!priceCategories.length || viewMode !== 'orgs') {
    pcSingleWrapper.classList.add('hidden');
    return;
  }

  if (!currentPriceCategoryId) {
    const basePc = priceCategories.find(pc => (pc.name || '').toLowerCase() === DEFAULT_PC_NAME.toLowerCase());
    currentPriceCategoryId = basePc ? basePc.id : priceCategories[0].id;
  }
  pcSingleWrapper.classList.remove('hidden');

  priceCategories.forEach(pc => {
    const id = pc.id;
    const name = pc.name || pc.id;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pc-chip';
    btn.dataset.value = id;
    const active = (id === currentPriceCategoryId);
    if (active) btn.classList.add('pc-chip-active');
    btn.innerHTML = `<span>${escapeHtml(name)}</span>`;
    btn.addEventListener('click', () => {
      currentPriceCategoryId = id;
      renderPcSingle();
      saveSessionSnapshot();
    });
    pcSingleChips.appendChild(btn);
  });
}

function updatePcMultiChipsUI() {
  pcMultiChips.querySelectorAll('.pc-chip').forEach(btn => {
    const val = btn.dataset.value;
    const active = selectedPcIdsMulti.has(val);
    btn.classList.toggle('pc-chip-active', active);
  });
}

function renderPcMulti() {
  pcMultiChips.innerHTML = '';

  if (!priceCategories.length) {
    pcMultiWrapper.classList.add('hidden');
    return;
  }
  const validIds = priceCategories.map(pc => pc.id);
  selectedPcIdsMulti = new Set(Array.from(selectedPcIdsMulti).filter(id => validIds.includes(id)));

  const basePc = priceCategories.find(pc => (pc.name || '').toLowerCase() === DEFAULT_PC_NAME.toLowerCase());
  const shouldUseAll = viewMode === 'priceCats' || viewMode === 'selection';
  const allSelected = validIds.length && selectedPcIdsMulti.size === validIds.length;

  if (shouldUseAll) {
    if (!allSelected) selectedPcIdsMulti = new Set(validIds);
  } else if (!selectedPcIdsMulti.size) {
    const fallback = basePc ? basePc.id : validIds[0];
    selectedPcIdsMulti = fallback ? new Set([fallback]) : new Set();
  }

  pcMultiWrapper.classList.remove('hidden');

  priceCategories.forEach(pc => {
    const id = pc.id;
    const name = pc.name || pc.id;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pc-chip pc-chip-active';
    btn.dataset.value = id;
    btn.innerHTML = `<span>${escapeHtml(name)}</span>`;
    btn.addEventListener('click', () => {
      if (selectedPcIdsMulti.has(id)) selectedPcIdsMulti.delete(id);
      else selectedPcIdsMulti.add(id);
      updatePcMultiChipsUI();
      saveSessionSnapshot();
    });
    pcMultiChips.appendChild(btn);
  });

  updatePcMultiChipsUI();
}

function getSelectedPcIdsForMulti() {
  return Array.from(selectedPcIdsMulti);
}

// === Таблица: общие функции ===
function getBaseColumnCount() {
  const hasDesc = showDescriptionColumn ? 1 : 0;
  if (viewMode === 'orgsAll' || viewMode === 'selection') return 6 + hasDesc;
  return 5 + hasDesc;
}

function updatePriceFilterGroupVisibility() {
  if (!priceFilterGroup) return;
  if (tableColumnKeys.length > 0) {
    priceFilterGroup.classList.remove('hidden');
  } else {
    priceFilterGroup.classList.add('hidden');
  }
}

function updateFilterAnyPriceBtn() {
  if (!filterAnyPriceBtn) return;
  filterAnyPriceBtn.className =
    'px-2 py-1 text-[12px] rounded border ' +
    (filterAnyPrice
      ? 'border-amber-400 bg-amber-200 text-amber-800'
      : 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300');
  filterAnyPriceBtn.textContent = filterAnyPrice ? 'Только с ценой ✓' : 'Только с ценой';
}

function updatePcFilterButtons() {
  const btns = menuTheadEl.querySelectorAll('.pc-filter-btn');
  btns.forEach(btn => {
    const key = btn.dataset.key;
    const active = !!filterPerPc[key];
    btn.className =
      'pc-filter-btn w-full px-2 py-1 text-[11px] rounded border ' +
      (active
        ? 'bg-amber-200 text-amber-800 border-amber-400'
        : 'bg-slate-900 text-slate-400 border-slate-700');
  });
}

// Развёртка/свёртка
function expandAllCities() {
  if (viewMode !== 'orgsAll' && viewMode !== 'selection') return;
  collapsedCities.clear();
  renderTable();
}
function collapseAllCities() {
  if (viewMode !== 'orgsAll' && viewMode !== 'selection') return;
  const items = getFilteredItems();
  const cities = new Set(items.map(i => i.cityLabel || 'Город не указан'));
  collapsedCities = cities;
  renderTable();
}
function expandAllCategories() {
  collapsedCategories.clear();
  renderTable();
}
function collapseAllCategories() {
  const items = getFilteredItems();
  if (viewMode === 'orgsAll' || viewMode === 'selection') {
    const keys = new Set();
    items.forEach(i => {
      const cityLabel = i.cityLabel || 'Город не указан';
      const cat = i.categoryPath || 'Без категории';
      keys.add(cityLabel + '||' + cat);
    });
    collapsedCategories = keys;
  } else {
    const cats = new Set(items.map(i => i.categoryPath || 'Без категории'));
    collapsedCategories = cats;
  }
  renderTable();
}

// === Шапка таблицы ===
function buildTableHeader() {
  const colLabels = tableColumnLabels || [];
  const colKeys   = tableColumnKeys || [];
  const baseCount = getBaseColumnCount();

  updatePriceFilterGroupVisibility();
  updateFilterAnyPriceBtn();

  // ----- первая строка (заголовки) -----
  let header1 = '<tr class="table-header-main">';

  if (viewMode === 'orgsAll' || viewMode === 'selection') {
    header1 += `
      <th class="px-3 py-2 text-center text-[12px] font-semibold tracking-wider border-r border-slate-800">
        <button type="button" data-role="toggle-rows" class="w-full font-semibold">✓</button>
      </th>
      <th class="px-3 py-2 text-center text-[12px] font-semibold tracking-wider border-r border-slate-800">
        <div class="flex items-center justify-center gap-1">
          <span>Город</span>
          <button type="button"
                  class="icon-toggle-btn"
                  data-role="cities-expand"
                  title="Развернуть все города">▾</button>
          <button type="button"
                  class="icon-toggle-btn"
                  data-role="cities-collapse"
                  title="Свернуть все города">▴</button>
        </div>
      </th>
      <th class="px-3 py-2 text-center text-[12px] font-semibold tracking-wider border-r border-slate-800">Фото</th>
      <th class="px-3 py-2 text-center text-[12px] font-semibold tracking-wider border-r border-slate-800">
        <div class="flex items-center justify-center gap-1">
          <span>Категория</span>
          <button type="button"
                  class="icon-toggle-btn"
                  data-role="cats-expand"
                  title="Развернуть все категории">▾</button>
          <button type="button"
                  class="icon-toggle-btn"
                  data-role="cats-collapse"
                  title="Свернуть все категории">▴</button>
        </div>
      </th>
      <th class="px-3 py-2 text-center text-[12px] font-semibold tracking-wider border-r border-slate-800">Наименование</th>
    `;
    if (showDescriptionColumn) {
      header1 += `
      <th class="px-3 py-2 text-center text-[12px] font-semibold tracking-wider border-r border-slate-800">Описание</th>`;
    }
    header1 += `
      <th class="px-3 py-2 text-center text-[12px] font-semibold tracking-wider border-r border-slate-800">SKU</th>
    `;
  } else {
    header1 += `
      <th class="px-3 py-2 text-center text-[12px] font-semibold tracking-wider border-r border-slate-800">
        <button type="button" data-role="toggle-rows" class="w-full font-semibold">✓</button>
      </th>
      <th class="px-3 py-2 text-center text-[12px] font-semibold tracking-wider border-r border-slate-800">Фото</th>
      <th class="px-3 py-2 text-center text-[12px] font-semibold tracking-wider border-r border-slate-800">
        <div class="flex items-center justify-center gap-1">
          <span>Категория</span>
          <button type="button"
                  class="icon-toggle-btn"
                  data-role="cats-expand"
                  title="Развернуть все категории">▾</button>
          <button type="button"
                  class="icon-toggle-btn"
                  data-role="cats-collapse"
                  title="Свернуть все категории">▴</button>
        </div>
      </th>
      <th class="px-3 py-2 text-center text-[12px] font-semibold tracking-wider border-r border-slate-800">Наименование</th>
    `;
    if (showDescriptionColumn) {
      header1 += `
      <th class="px-3 py-2 text-center text-[12px] font-semibold tracking-wider border-r border-slate-800">Описание</th>`;
    }
    header1 += `
      <th class="px-3 py-2 text-center text-[12px] font-semibold tracking-wider border-r border-slate-800">SKU</th>
    `;
  }

  const pcSubtitle = (viewMode === 'orgs') ? getCurrentPriceCategoryName() : '';
  colLabels.forEach(label => {
    const subtitle = pcSubtitle ? `<div class="text-[11px] text-slate-500 leading-tight">${escapeHtml(pcSubtitle)}</div>` : '';
    header1 += `
      <th class="px-3 py-2 text-center text-[12px] font-semibold tracking-wider border-r border-slate-800">
        <div class="flex flex-col items-center justify-center leading-tight">
          <span>${escapeHtml(label || '')}</span>
          ${subtitle}
        </div>
      </th>`;
  });
  header1 += '</tr>';

  // ----- вторая строка (фильтры) -----
  let header2 = '<tr class="table-header-filters">';

  const isCitiesMode = (viewMode === 'orgsAll' || viewMode === 'selection');
  let categoryIdx, nameIdx, codeIdx;

  if (isCitiesMode) {
    categoryIdx = 3;
    nameIdx     = 4;
    codeIdx     = showDescriptionColumn ? 6 : 5;
  } else {
    categoryIdx = 2;
    nameIdx     = 3;
    codeIdx     = showDescriptionColumn ? 5 : 4;
  }

  for (let i = 0; i < baseCount; i++) {
    if (i === categoryIdx) {
      header2 += `
        <th class="px-3 py-1 border-t border-slate-800 border-r border-slate-800">
          <input id="filterCategory" type="text"
                 class="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[12px] focus:outline-none focus:ring focus:ring-blue-500"
                 placeholder="Фильтр категории"/>
        </th>`;
    } else if (i === nameIdx) {
      header2 += `
        <th class="px-3 py-1 border-t border-slate-800 border-r border-slate-800">
          <input id="filterName" type="text"
                 class="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[12px] focus:outline-none focus:ring focus:ring-blue-500"
                 placeholder="Фильтр по названию"/>
        </th>`;
    } else if (i === codeIdx) {
      header2 += `
        <th class="px-3 py-1 border-t border-slate-800 border-r border-slate-800">
          <input id="filterCode" type="text"
                 class="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[12px] focus:outline-none focus:ring focus:ring-blue-500"
                 placeholder="Фильтр по SKU"/>
        </th>`;
    } else {
      header2 += `<th class="px-3 py-1 border-t border-slate-800 border-r border-slate-800"></th>`;
    }
  }

  if (viewMode === 'orgsAll' || viewMode === 'priceCats' || viewMode === 'selection' || viewMode === 'orgs') {
    colLabels.forEach((label, idx) => {
      const key = colKeys[idx];
      header2 += `
        <th class="px-3 py-1 border-t border-slate-800 border-r border-slate-800">
          <button type="button"
                  class="pc-filter-btn w-full px-2 py-1 text-[11px] rounded border bg-slate-900 text-slate-400 border-slate-700"
                  data-key="${escapeHtml(key)}">
            без цен
          </button>
        </th>`;
    });
  } else {
    colLabels.forEach(() => {
      header2 += `<th class="px-3 py-1 border-t border-slate-800 border-r border-slate-800"></th>`;
    });
  }

  header2 += '</tr>';

  menuTheadEl.innerHTML = header1 + header2;

  if (!theadControlsBound) {
    menuTheadEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-role]');
      if (!btn) return;
      const role = btn.dataset.role;
      if (role === 'cities-expand')      expandAllCities();
      else if (role === 'cities-collapse')   collapseAllCities();
      else if (role === 'cats-expand')   expandAllCategories();
      else if (role === 'cats-collapse') collapseAllCategories();
    });
    theadControlsBound = true;
  }

  filterCategoryInput = document.getElementById('filterCategory');
  filterNameInput     = document.getElementById('filterName');
  filterCodeInput     = document.getElementById('filterCode');

  [filterCategoryInput, filterNameInput, filterCodeInput].forEach(inp => {
    if (inp) inp.addEventListener('input', () => renderTable());
  });

  const pcFilterButtons = menuTheadEl.querySelectorAll('.pc-filter-btn');
  pcFilterButtons.forEach(btn => {
    const key = btn.dataset.key;
    if (!(key in filterPerPc)) filterPerPc[key] = false;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      filterPerPc[key] = !filterPerPc[key];
      updatePcFilterButtons();
      renderTable();
    });
  });
  updatePcFilterButtons();
  updateFilterAnyPriceBtn();
  applyFontSize();
}

// Шапка для "предзагрузочной" таблицы сверки (без цен, просто список)
function buildSelectionPreloadHeader() {
  const hasDesc = showDescriptionColumn;
  const baseCount = 5 + hasDesc;

  tableColumnLabels = [];
  tableColumnKeys = [];
  updatePriceFilterGroupVisibility();
  updateFilterAnyPriceBtn();

  let header1 = '<tr class="table-header-main">';
  header1 += `
    <th class="px-3 py-2 text-center text-[12px] font-semibold tracking-wider border-r border-slate-800">✓</th>
    <th class="px-3 py-2 text-center text-[12px] font-semibold tracking-wider border-r border-slate-800">Фото</th>
    <th class="px-3 py-2 text-center text-[12px] font-semibold tracking-wider border-r border-slate-800">Категория</th>
    <th class="px-3 py-2 text-center text-[12px] font-semibold tracking-wider border-r border-slate-800">Наименование</th>
  `;
  if (showDescriptionColumn) {
    header1 += `
      <th class="px-3 py-2 text-center text-[12px] font-semibold tracking-wider border-r border-slate-800">Описание</th>`;
  }
  header1 += `
    <th class="px-3 py-2 text-center text-[12px] font-semibold tracking-wider border-r border-slate-800">SKU</th>
    <th class="px-3 py-2 text-center text-[12px] font-semibold tracking-wider border-r border-slate-800"></th>
  `;
  header1 += '</tr>';

  let header2 = '<tr class="table-header-filters">';
  const categoryIdx = 2;
  const nameIdx     = 3;
  const codeIdx     = showDescriptionColumn ? 5 : 4;
  const total = showDescriptionColumn ? 7 : 6;

  for (let i = 0; i < total; i++) {
    if (i === categoryIdx) {
      header2 += `
        <th class="px-3 py-1 border-t border-slate-800 border-r border-slate-800">
          <input id="filterCategory" type="text"
                 class="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[12px] focus:outline-none focus:ring focus:ring-blue-500"
                 placeholder="Фильтр категории"/>
        </th>`;
    } else if (i === nameIdx) {
      header2 += `
        <th class="px-3 py-1 border-t border-slate-800 border-r border-slate-800">
          <input id="filterName" type="text"
                 class="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[12px] focus:outline-none focus:ring focus:ring-blue-500"
                 placeholder="Фильтр по названию"/>
        </th>`;
    } else if (i === codeIdx) {
      header2 += `
        <th class="px-3 py-1 border-t border-slate-800 border-r border-slate-800">
          <input id="filterCode" type="text"
                 class="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[12px] focus:outline-none focus:ring focus:ring-blue-500"
                 placeholder="Фильтр по SKU"/>
        </th>`;
    } else {
      header2 += `<th class="px-3 py-1 border-t border-slate-800 border-r border-slate-800"></th>`;
    }
  }

  header2 += '</tr>';

  menuTheadEl.innerHTML = header1 + header2;

  filterCategoryInput = document.getElementById('filterCategory');
  filterNameInput     = document.getElementById('filterName');
  filterCodeInput     = document.getElementById('filterCode');

  [filterCategoryInput, filterNameInput, filterCodeInput].forEach(inp => {
    if (inp) inp.addEventListener('input', () => renderTable());
  });

  updatePriceFilterGroupVisibility();
  applyFontSize();
}

// Фильтрация
function getFilteredItems() {
  if (!Array.isArray(allItems)) return [];
  const fc = (filterCategoryInput?.value || '').toLowerCase();
  const fn = (filterNameInput?.value || '').toLowerCase();
  const fcode = (filterCodeInput?.value || '').toLowerCase();

  return allItems.filter(item => {
    const cat  = (item.categoryPath || '').toLowerCase();
    const name = (item.name || '').toLowerCase();
    const code = (item.code || '').toLowerCase();
    if (fc && !cat.includes(fc)) return false;
    if (fn && !name.includes(fn)) return false;
    if (fcode && !code.includes(fcode)) return false;

    const rowPrices = item.prices || {};
    const colKeys = tableColumnKeys || [];

    if (filterAnyPrice && colKeys.length > 0) {
      const hasAnyPrice = colKeys.some(k => {
        const v = rowPrices[k];
        return !(v === undefined || v === null || v === '');
      });
      if (!hasAnyPrice) return false;
    }

    if (viewMode === 'orgsAll' || viewMode === 'priceCats' || (viewMode === 'selection' && modeState.selection.loaded)) {
      for (const key of colKeys) {
        if (!filterPerPc[key]) continue;
        const v = rowPrices[key];
        const empty = (v === undefined || v === null || v === '');
        if (empty) return false;
      }
    }

    return true;
  });
}

function updateTableInfo(rowsCount) {
  const orgCount = selectedOrgIds.size;
  const dishCount = selectionItems.size;

  const parts = [];
  if (rowsCount != null) {
    parts.push(`Загружено позиций: ${rowsCount}`);
  } else if (allItems.length) {
    parts.push(`Загружено позиций: ${allItems.length}`);
  }
  if (orgCount) parts.push(`Выбрано городов: ${orgCount}`);
  parts.push(`Блюд в выборке: ${dishCount}`);
  if (tableColumnLabels.length) parts.push(`Доп. столбцов: ${tableColumnLabels.length}`);

  tableInfoEl.textContent = parts.join(' • ');
}

function renderImageModalState() {
  const entry = imageModalState.list[imageModalState.index];
  if (!entry) return;
  const fullName = entry.sizeName ? `${entry.name} (${entry.sizeName})` : entry.name;
  imageModalImg.src = entry.url || NO_PHOTO_PLACEHOLDER;
  imageModal.classList.remove('hidden');
  imageModal.classList.add('flex');
  imageModalTitle.textContent = fullName || 'Блюдо';
  imageModalSku.textContent = entry.sku ? `SKU: ${entry.sku}` : '';
  if (imageModalDescription) {
    const descEl = imageModalDescription.querySelector('span') || imageModalDescription;
    const desc = entry.description || '';
    descEl.textContent = desc || 'Описание отсутствует';
    imageModalDescription.classList.toggle('opacity-60', !desc);
  }
  if (!entry.rawUrl) {
    setImageModalStatus('Нет фото', 'info');
  } else {
    setImageModalStatus('');
  }
}

function setImageModalStatus(text, type = 'info') {
  if (!imageModalStatus) return;
  imageModalStatus.textContent = text || '';
  const base = 'text-xs text-center';
  const color = type === 'success'
    ? 'text-emerald-200'
    : type === 'error'
      ? 'text-rose-200'
      : 'text-white/90';
  imageModalStatus.className = `${base} ${color}`;
}

function registerImageEntry({ key, url, rawUrl, name, sizeName, sku, description }) {
  const normalizedKey = key || `${sku || ''}|${sizeName || ''}` || url || rawUrl;
  if (normalizedKey && imageIndexMap.has(normalizedKey)) {
    return imageIndexMap.get(normalizedKey);
  }
  const entry = { key: normalizedKey, url, rawUrl, name, sizeName, sku, description: description || '' };
  const idx = imageModalState.list.length;
  imageModalState.list.push(entry);
  if (normalizedKey) imageIndexMap.set(normalizedKey, idx);
  return idx;
}

function openImageModalFromUrl(url, name = '', sku = '', description = '') {
  const safeUrl = url || '';
  imageModalState.list = [{
    key: sku || safeUrl || name,
    url: safeUrl ? safeUrl : NO_PHOTO_PLACEHOLDER,
    rawUrl: safeUrl,
    name,
    sizeName: '',
    sku,
    description: description || ''
  }];
  imageModalState.index = 0;
  renderImageModalState();
  imageModal.classList.remove('hidden');
  imageModal.classList.add('flex');
}

function openImageModal(idxOrUrl) {
  if (typeof idxOrUrl === 'number') {
    openImageModalByIndex(idxOrUrl);
    return;
  }
  const idx = imageModalState.list.findIndex(e => e.url === idxOrUrl || e.rawUrl === idxOrUrl);
  if (idx !== -1) {
    openImageModalByIndex(idx);
    return;
  }
  if (idxOrUrl) {
    openImageModalFromUrl(idxOrUrl);
  }
}

function openImageModalByIndex(idx) {
  if (!imageModalState.list.length) return;
  imageModalState.index = ((idx % imageModalState.list.length) + imageModalState.list.length) % imageModalState.list.length;
  renderImageModalState();
  imageModal.classList.remove('hidden');
  imageModal.classList.add('flex');
}

function closeImageModalWindow() {
  imageModal.classList.add('hidden');
  imageModal.classList.remove('flex');
  imageModalImg.src = '';
}

function stepImageModal(delta) {
  if (!imageModalState.list.length) return;
  imageModalState.index = (imageModalState.index + delta + imageModalState.list.length) % imageModalState.list.length;
  renderImageModalState();
}

if (imageModal) {
  imageModal.addEventListener('click', (e) => {
    if (e.target === imageModal) {
      closeImageModalWindow();
    }
  });
}

if (closeImageModalBtn) {
  closeImageModalBtn.addEventListener('click', (e) => {
    e.preventDefault();
    closeImageModalWindow();
  });
}

if (imageModalBody) {
  imageModalBody.addEventListener('click', (e) => {
    const rect = imageModalBody.getBoundingClientRect();
    const isRight = (e.clientX - rect.left) > rect.width / 2;
    stepImageModal(isRight ? 1 : -1);
  });
}

document.addEventListener('keydown', (e) => {
  if (imageModal.classList.contains('hidden')) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); stepImageModal(1); }
  if (e.key === 'ArrowLeft')  { e.preventDefault(); stepImageModal(-1); }
  if (e.key === 'Escape')     { closeImageModalWindow(); }
});

async function checkCurrentImageActuality() {
  const entry = imageModalState.list[imageModalState.index];
  if (!entry || !currentMenuId) return;

  const defaultLabel = checkImageBtn ? (checkImageBtn.dataset.defaultLabel || checkImageBtn.textContent.trim()) : '';
  if (checkImageBtn) {
    checkImageBtn.disabled = true;
    checkImageBtn.dataset.defaultLabel = defaultLabel;
    checkImageBtn.textContent = 'Проверяю...';
    checkImageBtn.classList.add('loading');
  }
  setImageModalStatus('Проверяю фото...', 'info');

  try {
    const orgIdForImages = selectedOrgIds.size
      ? Array.from(selectedOrgIds)[0]
      : (organizations[0] ? organizations[0].id : null);
    if (!orgIdForImages) return;

    const { map, error, details } = await fetchImageMapForCurrentMenu(orgIdForImages);
    if (error) {
      const detailMsg = details ? ` (${details})` : '';
      setStatus(`Ошибка при обновлении фото: ${error}${detailMsg}`, 'error');
      setImageModalStatus(`Ошибка: ${error}${detailMsg}`, 'error');
      return;
    }
    if (!map || map.size === 0) {
      setStatus('Не удалось проверить фото: нет данных из iiko.', 'error');
      setImageModalStatus('Нет данных из iiko', 'error');
      return;
    }
    const latest = map.get(entry.key) || '';
    if (!latest && entry.url) {
      entry.url = '';
      entry.rawUrl = '';
      setStatus('Фото удалено в iiko, показан плейсхолдер.', 'info');
      setImageModalStatus('Фото удалено в iiko', 'info');
      updateImagesFromMap(map);
      imageVersion++;
      renderImageModalState();
      renderTable();
      return;
    }

    if (latest && entry.rawUrl === latest) {
      setStatus('Фото актуально', 'success');
      setImageModalStatus('Фото актуально', 'success');
      return;
    }

    if (latest && entry.rawUrl !== latest) {
      entry.rawUrl = latest;
      entry.url = `/img?url=${encodeURIComponent(latest)}${imageVersion ? '&v=' + imageVersion : ''}`;
      const imageMapSingle = new Map([[entry.key, latest]]);
      await updateImagesFromMap(imageMapSingle);
      imageVersion++;
      renderImageModalState();
      renderTable();
      setStatus('Фото обновлено по данным iiko.', 'success');
      setImageModalStatus('Фото обновлено', 'success');
    }
  } catch (e) {
    console.error(e);
    setStatus(`Ошибка при проверке фото: ${e.message}`, 'error');
    setImageModalStatus(`Ошибка: ${e.message}`, 'error');
  } finally {
    if (checkImageBtn) {
      checkImageBtn.disabled = false;
      checkImageBtn.textContent = defaultLabel || 'Проверить актуальность фото';
      checkImageBtn.classList.remove('loading');
    }
  }
}

if (checkImageBtn) {
  checkImageBtn.addEventListener('click', (e) => {
    e.preventDefault();
    checkCurrentImageActuality();
  });
}

// Выделение строк (Shift/Ctrl)
function updateRowRangeSelectionStyles() {
  const rows = menuTbodyEl.querySelectorAll('tr[data-item-key]');
  rows.forEach(tr => {
    const key = tr.dataset.itemKey;
    const wrap = tr.querySelector('.checkbox-wrap');
    const input = tr.querySelector('.row-checkbox');
    const isSelected = selectedRowKeys.has(key);
    const inSelection = selectionItems.has(key.split('||').slice(-1)[0]) || selectionItems.has(key);

    tr.classList.toggle('row-range-selected', isSelected);

    if (wrap) {
      wrap.classList.toggle('checkbox-selected', isSelected);
      const shouldGreen = inSelection && viewMode !== 'selection';
      wrap.classList.toggle('checkbox-in-selection', shouldGreen);
    }
    if (input) {
      input.checked = isSelected;
    }
  });
}

function handleRowClick(e, itemKey) {
  if (!itemKey) return;
  const isCheckboxTarget = e?.target?.closest('.row-checkbox');
  const isShift = e.shiftKey;
  const isCtrl  = e.ctrlKey || e.metaKey;

  if (isCheckboxTarget && !isShift && !isCtrl) {
    if (selectedRowKeys.has(itemKey)) selectedRowKeys.delete(itemKey);
    else selectedRowKeys.add(itemKey);
    lastSelectedRowKey = itemKey;
    updateRowRangeSelectionStyles();
    return;
  }

  const rows = Array.from(menuTbodyEl.querySelectorAll('tr[data-item-key]'));

  if (isShift && lastSelectedRowKey) {
    const startIndex = rows.findIndex(r => r.dataset.itemKey === lastSelectedRowKey);
    const endIndex   = rows.findIndex(r => r.dataset.itemKey === itemKey);
    if (startIndex !== -1 && endIndex !== -1) {
      const from = Math.min(startIndex, endIndex);
      const to   = Math.max(startIndex, endIndex);
      for (let i = from; i <= to; i++) {
        selectedRowKeys.add(rows[i].dataset.itemKey);
      }
    } else {
      selectedRowKeys.add(itemKey);
    }
  } else if (isCtrl) {
    if (selectedRowKeys.has(itemKey)) selectedRowKeys.delete(itemKey);
    else selectedRowKeys.add(itemKey);
    lastSelectedRowKey = itemKey;
  } else {
    if (selectedRowKeys.has(itemKey)) selectedRowKeys.delete(itemKey);
    else selectedRowKeys.add(itemKey);
    lastSelectedRowKey = itemKey;
  }
  updateRowRangeSelectionStyles();
}

function selectAllVisibleRows() {
  const rows = menuTbodyEl.querySelectorAll('tr[data-item-key]');
  rows.forEach(tr => selectedRowKeys.add(tr.dataset.itemKey));
  updateRowRangeSelectionStyles();
}

function clearAllRowSelections() {
  selectedRowKeys.clear();
  lastSelectedRowKey = null;
  updateRowRangeSelectionStyles();
}

// === Таблица сверки "предзагрузка" ===
function renderSelectionPreloadBody() {
  menuTbodyEl.innerHTML = '';

  const selectionArray = Array.from(selectionItems.entries()).map(([key, base]) => ({
    code: base.code,
    name: base.name,
    externalName: base.externalName || '',
    categoryPath: base.categoryPath || '',
    sizeName: base.sizeName || '',
    imageUrl: base.imageUrl || '',
    prices: {},
    _key: key
  }));

  allItems = selectionArray;

  const hasDesc = showDescriptionColumn;
  const columnsCount = hasDesc ? 7 : 6;

  if (!selectionArray.length) {
    menuTbodyEl.innerHTML = `
      <tr>
        <td colspan="${columnsCount}"
            class="px-3 py-3 text-center text-[12px] text-slate-500 border-t border-slate-800">
          Таблица сверки цен пуста. Добавьте блюда через правый клик по строке или кнопку «Поиск блюд».
        </td>
      </tr>`;
    updateTableInfo(0);
    exportBtn.disabled = true;
    updateRowRangeSelectionStyles();
    return;
  }

  const filtered = getFilteredItems();
  imageModalState.list = [];
  imageIndexMap = new Map();
  const fc = filterCategoryInput?.value || '';
  const fn = filterNameInput?.value || '';
  const fcode = filterCodeInput?.value || '';

  if (!filtered.length) {
    menuTbodyEl.innerHTML = `
      <tr>
        <td colspan="${columnsCount}"
            class="px-3 py-3 text-center text-[12px] text-slate-500 border-t border-slate-800">
          Под текущие фильтры ничего не найдено.
        </td>
      </tr>`;
    updateTableInfo(0);
    exportBtn.disabled = true;
    updateRowRangeSelectionStyles();
    return;
  }

  filtered.forEach(item => {
    const shortKey = item.code + '|' + (item.sizeName || '');
    const tr = document.createElement('tr');
    tr.className = 'menu-data-row hover:bg-indigo-900/40 border-b border-slate-800/70 relative overflow-visible';
    tr.dataset.itemKey = shortKey;

    const tdCheck = document.createElement('td');
    tdCheck.className = 'px-3 py-2 align-middle border-r border-slate-800/70 text-center';
    const label = document.createElement('label');
    label.className = 'checkbox-wrap';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'row-checkbox';
    input.dataset.itemKey = shortKey;
    const spanBox = document.createElement('span');
    spanBox.className = 'checkbox-custom';
    label.appendChild(input);
    label.appendChild(spanBox);
    tdCheck.appendChild(label);
    tr.appendChild(tdCheck);

    const tdPhoto = document.createElement('td');
    tdPhoto.className = 'px-3 py-2 align-middle border-r border-slate-800/70 text-center';
    tdPhoto.dataset.col = 'photo';
    if (item.imageUrl) {
      const baseUrl = `/img?url=${encodeURIComponent(item.imageUrl)}${imageVersion ? '&v=' + imageVersion : ''}`;
      const thumbUrl = baseUrl + '&thumb=1';
      const galleryIndex = imageModalState.list.length;
      imageModalState.list.push({
        key: shortKey,
        url: baseUrl,
        rawUrl: item.imageUrl || '',
        name: item.name || '',
        sizeName: item.sizeName || '',
        sku: item.code || '',
        description: item.externalName || item.description || ''
      });
      const safeName = escapeHtml(item.name || '');
      const safeSize = escapeHtml(item.sizeName || '');
      const safeSku  = escapeHtml(item.code || '');
      const safeDesc = escapeHtml(item.externalName || item.description || '');
      tdPhoto.innerHTML = `
        <div class="relative group w-12 h-12 mx-auto">
          <img data-lazy-src="${thumbUrl}"
               src="${LAZY_PLACEHOLDER}"
               decoding="async"
               data-gallery-index="${galleryIndex}"
               data-full-url="${baseUrl}"
               data-raw-url="${item.imageUrl || ''}"
               data-name="${safeName}"
               data-size="${safeSize}"
               data-sku="${safeSku}"
               data-description="${safeDesc}"
               data-image-key="${shortKey}"
               class="w-12 h-12 object-cover rounded-md bg-slate-900 border border-slate-200 cursor-pointer" />
        </div>`;
      const img = tdPhoto.querySelector('img');
      if (img) {
        registerLazyImage(img, thumbUrl);
        img.addEventListener('click', e => {
          e.stopPropagation();
          const idx = Number(img.dataset.galleryIndex || 0);
          openImageModalByIndex(idx);
        });
      }
    } else {
      const galleryIndex = registerImageEntry({
        key: shortKey,
        url: '',
        rawUrl: '',
        name: item.name || '',
        sizeName: item.sizeName || '',
        sku: item.code || '',
        description: item.externalName || item.description || ''
      });
      const safeName = escapeHtml(item.name || '');
      const safeSize = escapeHtml(item.sizeName || '');
      const safeSku  = escapeHtml(item.code || '');
      const safeDesc = escapeHtml(item.externalName || item.description || '');
      tdPhoto.innerHTML = `
        <button type="button" data-gallery-index="${galleryIndex}"
                data-name="${safeName}" data-size="${safeSize}" data-sku="${safeSku}" data-description="${safeDesc}" data-image-key="${shortKey}"
                class="w-10 h-10 rounded-md border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 mx-auto bg-white hover:bg-slate-50">
          нет фото
        </button>`;
      const btn = tdPhoto.querySelector('button');
      if (btn) btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = Number(btn.dataset.galleryIndex || 0);
        openImageModalByIndex(idx);
      });
    }
    tr.appendChild(tdPhoto);

    const tdCat = document.createElement('td');
    tdCat.className = 'px-3 py-2 align-middle border-r border-slate-800/70 max-w-[220px] whitespace-normal break-words text-center';
    tdCat.dataset.col = 'category';
    tdCat.innerHTML = highlightMatch(item.categoryPath || '', fc);
    tr.appendChild(tdCat);

    const tdName = document.createElement('td');
    tdName.className = 'px-3 py-2 align-middle border-r border-slate-800/70 max-w-[260px] whitespace-normal break-words text-center';
    tdName.dataset.col = 'name';
    const fullName = item.sizeName
      ? `${item.name || ''} (${item.sizeName})`
      : item.name || '';
    tdName.innerHTML = highlightMatch(fullName, fn);
    tr.appendChild(tdName);

    if (showDescriptionColumn) {
      const tdDesc = document.createElement('td');
      tdDesc.className = 'px-3 py-2 align-middle border-r border-slate-800/70 max-w-[260px] whitespace-normal break-words text-center text-[12px] text-slate-600';
      tdDesc.dataset.col = 'description';
      tdDesc.textContent = item.externalName || '';
      tr.appendChild(tdDesc);
    }

    const tdCode = document.createElement('td');
    tdCode.className = 'px-3 py-2 align-middle border-r border-slate-800/70 font-mono text-[12px] text-center';
    tdCode.dataset.col = 'sku';
    tdCode.innerHTML = highlightMatch(item.code || '', fcode);
    tr.appendChild(tdCode);

    const tdEmpty = document.createElement('td');
    tdEmpty.className = 'px-3 py-2 align-middle border-r border-slate-800/70';
    tr.appendChild(tdEmpty);

    tr.addEventListener('click', (e) => {
      if (e.target.closest('.row-checkbox')) {
        handleRowClick(e, shortKey);
        return;
      }
      handleRowClick(e, shortKey);
    });

    menuTbodyEl.appendChild(tr);
  });

  updateTableInfo(filtered.length);
  exportBtn.disabled = true;
  updateRowRangeSelectionStyles();
  applyFontSize();
}

function updateSelectionPreloadFromSelectionItems() {
  if (viewMode !== 'selection') return;
  modeState.selection.loaded = false;
  buildSelectionPreloadHeader();
  renderSelectionPreloadBody();
}

// Общий рендер
function renderTable() {
  if (viewMode === 'selection' && !modeState.selection.loaded) {
    renderSelectionPreloadBody();
  } else if (viewMode === 'orgsAll' || viewMode === 'selection') {
    renderTableOrgsAll();
  } else {
    renderTableCommon();
  }
  syncImageButtonAvailability();
  syncTableHeaderOffset();
}

// Ячейка с фото
function makePhotoCell(item) {
  const tdPhoto = document.createElement('td');
  tdPhoto.className = 'px-3 py-2 align-middle border-r border-slate-800/70 text-center';
  tdPhoto.dataset.col = 'photo';
  if (item.imageUrl) {
    const baseUrl = `/img?url=${encodeURIComponent(item.imageUrl)}${imageVersion ? '&v=' + imageVersion : ''}`;
    const thumbUrl = baseUrl + '&thumb=1';
    const galleryIndex = registerImageEntry({
      key: item.code + '|' + (item.sizeName || ''),
      url: baseUrl,
      rawUrl: item.imageUrl || '',
      name: item.name || '',
      sizeName: item.sizeName || '',
      sku: item.code || '',
      description: item.externalName || item.description || ''
    });
    const safeName = escapeHtml(item.name || '');
    const safeSize = escapeHtml(item.sizeName || '');
    const safeSku  = escapeHtml(item.code || '');
    const safeDesc = escapeHtml(item.externalName || item.description || '');
    tdPhoto.innerHTML = `
      <div class="relative group w-12 h-12 mx-auto">
        <img src="${thumbUrl}"
             loading="lazy"
             decoding="async"
             data-gallery-index="${galleryIndex}"
             data-full-url="${baseUrl}"
             data-raw-url="${item.imageUrl || ''}"
             data-name="${safeName}"
             data-size="${safeSize}"
             data-sku="${safeSku}"
             data-description="${safeDesc}"
             data-image-key="${item.code + '|' + (item.sizeName || '')}"
             class="w-12 h-12 object-cover rounded-md transition-transform duration-150 transform group-hover:scale-150 group-hover:z-20 group-hover:absolute group-hover:ring-2 group-hover:ring-blue-500 bg-slate-900 border border-slate-200 cursor-pointer"/>
      </div>`;
    const img = tdPhoto.querySelector('img');
    if (img) img.addEventListener('click', e => {
      e.stopPropagation();
      const idx = Number(img.dataset.galleryIndex || 0);
      openImageModalByIndex(idx);
    });
  } else {
    const galleryIndex = registerImageEntry({
      key: item.code + '|' + (item.sizeName || ''),
      url: '',
      rawUrl: '',
      name: item.name || '',
      sizeName: item.sizeName || '',
      sku: item.code || '',
      description: item.externalName || item.description || ''
    });
    const safeName = escapeHtml(item.name || '');
    const safeSize = escapeHtml(item.sizeName || '');
    const safeSku  = escapeHtml(item.code || '');
    const safeDesc = escapeHtml(item.externalName || item.description || '');
    tdPhoto.innerHTML = `
      <button type="button" data-gallery-index="${galleryIndex}"
              data-name="${safeName}" data-size="${safeSize}" data-sku="${safeSku}" data-description="${safeDesc}" data-image-key="${item.code + '|' + (item.sizeName || '')}"
              class="w-10 h-10 rounded-md border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 mx-auto bg-white hover:bg-slate-50">
        нет фото
      </button>`;
    const btn = tdPhoto.querySelector('button');
    if (btn) btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = Number(btn.dataset.galleryIndex || 0);
      openImageModalByIndex(idx);
    });
  }
  return tdPhoto;
}

// Режимы без городов: orgs / priceCats
function renderTableCommon() {
  menuTbodyEl.innerHTML = '';
  imageModalState.list = [];
  imageIndexMap = new Map();
  if (!tableColumnKeys.length || !tableColumnLabels.length) {
    updateTableInfo(0);
    exportBtn.disabled = true;
    updateRowRangeSelectionStyles();
    return;
  }

  const colKeys = tableColumnKeys;
  const colLabels = tableColumnLabels;
  const baseCount = getBaseColumnCount();

  const filteredItems = getFilteredItems();
  if (!filteredItems.length) {
    menuTbodyEl.innerHTML = `
      <tr>
        <td colspan="${baseCount + colLabels.length}" class="px-3 py-3 text-center text-[12px] text-slate-500 border-t border-slate-800">
          Блюда не найдены для выбранных параметров
        </td>
      </tr>`;
    updateTableInfo(0);
    exportBtn.disabled = true;
    updateRowRangeSelectionStyles();
    return;
  }

    const grouped = new Map();
    filteredItems.forEach(item => {
      const cat = item.categoryPath || 'Без категории';
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat).push(item);
    });

    const sortedCats = keysInOrder(grouped);
  const fc = filterCategoryInput?.value || '';
  const fn = filterNameInput?.value || '';
  const fcode = filterCodeInput?.value || '';

  sortedCats.forEach(cat => {
    const items = grouped.get(cat) || [];
    const isCollapsed = collapsedCategories.has(cat);

    const trGroup = document.createElement('tr');
    trGroup.className = 'group-category-row cursor-pointer';
    trGroup.dataset.category = cat;
    trGroup.innerHTML = `
      <td colspan="${baseCount + colLabels.length}"
          class="px-3 py-2 text-[12px] font-semibold border-t border-b border-slate-800">
        <span class="inline-flex items-center gap-2">
          <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700">
            ${isCollapsed ? '+' : '−'}
          </span>
          <span>${escapeHtml(cat)}</span>
          <span class="text-slate-500">(${items.length})</span>
        </span>
      </td>`;
    trGroup.addEventListener('click', () => {
      if (collapsedCategories.has(cat)) collapsedCategories.delete(cat);
      else collapsedCategories.add(cat);
      renderTable();
    });
    menuTbodyEl.appendChild(trGroup);

    if (isCollapsed) return;

    items.forEach(item => {
      const itemKey = item.code + '|' + (item.sizeName || '');
      const tr = document.createElement('tr');
      tr.className = 'menu-data-row hover:bg-indigo-900/40 border-b border-slate-800/70 relative overflow-visible';
      tr.dataset.itemKey = itemKey;

      const tdCheck = document.createElement('td');
      tdCheck.className = 'px-3 py-2 align-middle border-r border-slate-800/70 text-center';
      const label = document.createElement('label');
      label.className = 'checkbox-wrap';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'row-checkbox';
      input.dataset.itemKey = itemKey;
      const spanBox = document.createElement('span');
      spanBox.className = 'checkbox-custom';
      label.appendChild(input);
      label.appendChild(spanBox);
      tdCheck.appendChild(label);
      tr.appendChild(tdCheck);

      const tdPhoto = makePhotoCell(item);
      tr.appendChild(tdPhoto);

      const tdCat = document.createElement('td');
      tdCat.className = 'px-3 py-2 align-middle border-r border-slate-800/70 max-w-[220px] whitespace-normal break-words text-center';
      tdCat.dataset.col = 'category';
      tdCat.innerHTML = highlightMatch(item.categoryPath || '', fc);
      tr.appendChild(tdCat);

      const tdName = document.createElement('td');
      tdName.className = 'px-3 py-2 align-middle border-r border-slate-800/70 max-w-[260px] whitespace-normal break-words text-center';
      tdName.dataset.col = 'name';
      const fullName = item.sizeName
        ? `${item.name || ''} (${item.sizeName})`
        : item.name || '';
      tdName.innerHTML = highlightMatch(fullName, fn);
      tr.appendChild(tdName);

      if (showDescriptionColumn) {
        const tdDesc = document.createElement('td');
        tdDesc.className = 'px-3 py-2 align-middle border-r border-slate-800/70 max-w-[260px] whitespace-normal break-words text-center text-[12px] text-slate-600';
        tdDesc.dataset.col = 'description';
        tdDesc.textContent = item.externalName || '';
        tr.appendChild(tdDesc);
      }

      const tdCode = document.createElement('td');
      tdCode.className = 'px-3 py-2 align-middle border-r border-slate-800/70 font-mono text-[12px] text-center';
      tdCode.dataset.col = 'sku';
      tdCode.innerHTML = highlightMatch(item.code || '', fcode);
      tr.appendChild(tdCode);

      colLabels.forEach((_, idx) => {
        const key = colKeys[idx];
        const td = document.createElement('td');
        td.className = 'px-3 py-2 align-middle border-r border-slate-800/70 text-center font-semibold text-slate-900';
        const val = item.prices && item.prices[key];
        const disp = (val === undefined || val === null || val === '')
          ? ''
          : String(val).replace('.', ',');
        td.textContent = disp;
        tr.appendChild(td);
      });

      tr.addEventListener('click', (e) => {
        if (e.target.closest('.row-checkbox')) {
          handleRowClick(e, itemKey);
          return;
        }
        handleRowClick(e, itemKey);
      });

      menuTbodyEl.appendChild(tr);
    });
  });

  updateTableInfo(filteredItems.length);
  exportBtn.disabled = false;
  updateRowRangeSelectionStyles();
  applyFontSize();
}

// Режимы с городами: orgsAll / selection (когда уже загружены цены)
function renderTableOrgsAll() {
  menuTbodyEl.innerHTML = '';

  imageModalState.list = [];
  imageIndexMap = new Map();

  if (viewMode === 'selection' && !modeState.selection.loaded) {
    renderSelectionPreloadBody();
    return;
  }

  if (!tableColumnKeys.length || !tableColumnLabels.length) {
    updateTableInfo(0);
    exportBtn.disabled = true;
    updateRowRangeSelectionStyles();
    return;
  }

  const colKeys = tableColumnKeys;
  const colLabels = tableColumnLabels;
  const baseCount = getBaseColumnCount();

  const filteredItems = getFilteredItems();
  if (!filteredItems.length) {
    menuTbodyEl.innerHTML = `
      <tr>
        <td colspan="${baseCount + colLabels.length}" class="px-3 py-3 text-center text-[12px] text-slate-500 border-t border-slate-800">
          Блюда не найдены для выбранных параметров
        </td>
      </tr>`;
    updateTableInfo(0);
    exportBtn.disabled = true;
    updateRowRangeSelectionStyles();
    return;
  }

  const byCity = new Map();
  const cityOrderMap = buildCityOrderMap();
  const catOrderMap = new Map();
  filteredItems.forEach(item => {
    const cityLabel = item.cityLabel || 'Город не указан';
    if (!byCity.has(cityLabel)) byCity.set(cityLabel, new Map());
    const cat = item.categoryPath || 'Без категории';
    const catMap = byCity.get(cityLabel);
    if (!catMap.has(cat)) catMap.set(cat, []);
    catMap.get(cat).push(item);
    if (!catOrderMap.has(cat)) catOrderMap.set(cat, catOrderMap.size);
  });

    const sortedCities = keysInOrder(byCity);
  const fc = filterCategoryInput?.value || '';
  const fn = filterNameInput?.value || '';
  const fcode = filterCodeInput?.value || '';

  sortedCities.forEach(cityLabel => {
    const catMap = byCity.get(cityLabel);
    const cityCollapsed = collapsedCities.has(cityLabel);

    const totalItemsForCity = Array.from(catMap.values())
      .reduce((acc, arr) => acc + arr.length, 0);

    const trCity = document.createElement('tr');
    trCity.className = 'group-city-row cursor-pointer';
    trCity.dataset.city = cityLabel;
    trCity.innerHTML = `
      <td colspan="${baseCount + colLabels.length}"
          class="px-3 py-2 text-[12px] font-semibold text-slate-100 border-t border-b border-slate-800">
        <span class="inline-flex items-center gap-2">
          <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700">
            ${cityCollapsed ? '+' : '−'}
          </span>
          <span>Город: ${escapeHtml(cityLabel)}</span>
          <span class="text-slate-400">(${totalItemsForCity})</span>
        </span>
      </td>`;
    trCity.addEventListener('click', () => {
      if (collapsedCities.has(cityLabel)) collapsedCities.delete(cityLabel);
      else collapsedCities.add(cityLabel);
      renderTable();
    });
    menuTbodyEl.appendChild(trCity);

    if (cityCollapsed) return;

      const sortedCats = keysInOrder(catMap);

      sortedCats.forEach(cat => {
      const items = catMap.get(cat) || [];
      const catKey = cityLabel + '||' + cat;
      const isCollapsed = collapsedCategories.has(catKey);

      const trGroup = document.createElement('tr');
      trGroup.className = 'group-category-row cursor-pointer';
      trGroup.dataset.catKey = catKey;
      trGroup.innerHTML = `
        <td colspan="${baseCount + colLabels.length}"
            class="pl-8 pr-3 py-2 text-[12px] font-semibold border-t border-b border-slate-800">
          <span class="inline-flex items-center gap-2">
            <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700">
              ${isCollapsed ? '+' : '−'}
            </span>
            <span>${escapeHtml(cat)}</span>
            <span class="text-slate-500">(${items.length})</span>
          </span>
        </td>`;
      trGroup.addEventListener('click', () => {
        if (collapsedCategories.has(catKey)) collapsedCategories.delete(catKey);
        else collapsedCategories.add(catKey);
        renderTable();
      });
      menuTbodyEl.appendChild(trGroup);

      if (isCollapsed) return;

      items.forEach(item => {
        const itemKey = item.key || (item.code + '|' + (item.sizeName || ''));
        const tr = document.createElement('tr');
        tr.className = 'menu-data-row hover:bg-indigo-900/40 border-b border-slate-800/70 relative overflow-visible';
        tr.dataset.itemKey = itemKey;

        const tdCheck = document.createElement('td');
        tdCheck.className = 'px-3 py-2 align-middle border-r border-slate-800/70 text-center';
        const label = document.createElement('label');
        label.className = 'checkbox-wrap';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'row-checkbox';
        input.dataset.itemKey = itemKey;
        const spanBox = document.createElement('span');
        spanBox.className = 'checkbox-custom';
        label.appendChild(input);
        label.appendChild(spanBox);
        tdCheck.appendChild(label);
        tr.appendChild(tdCheck);

        const tdCity = document.createElement('td');
        tdCity.className = 'px-3 py-2 align-middle border-r border-slate-800/70 text-center';
        tdCity.textContent = item.cityLabel || cityLabel;
        tr.appendChild(tdCity);

        const tdPhoto = makePhotoCell(item);
        tr.appendChild(tdPhoto);

        const tdCat = document.createElement('td');
        tdCat.className = 'px-3 py-2 align-middle border-r border-slate-800/70 max-w-[220px] whitespace-normal break-words text-center';
        tdCat.dataset.col = 'category';
        tdCat.innerHTML = highlightMatch(item.categoryPath || '', fc);
        tr.appendChild(tdCat);

        const tdName = document.createElement('td');
        tdName.className = 'px-3 py-2 align-middle border-r border-slate-800/70 max-w-[260px] whitespace-normal break-words text-center';
        tdName.dataset.col = 'name';
        const fullName = item.sizeName
          ? `${item.name || ''} (${item.sizeName})`
          : item.name || '';
        tdName.innerHTML = highlightMatch(fullName, fn);
        tr.appendChild(tdName);

        if (showDescriptionColumn) {
          const tdDesc = document.createElement('td');
          tdDesc.className = 'px-3 py-2 align-middle border-r border-slate-800/70 max-w-[260px] whitespace-normal break-words text-center text-[12px] text-slate-600';
          tdDesc.dataset.col = 'description';
          tdDesc.textContent = item.externalName || '';
          tr.appendChild(tdDesc);
        }

        const tdCode = document.createElement('td');
        tdCode.className = 'px-3 py-2 align-middle border-r border-slate-800/70 font-mono text-[12px] text-center';
        tdCode.dataset.col = 'sku';
        tdCode.innerHTML = highlightMatch(item.code || '', fcode);
        tr.appendChild(tdCode);

        colLabels.forEach((_, idx) => {
          const key = colKeys[idx];
          const td = document.createElement('td');
          td.className = 'px-3 py-2 align-middle border-r border-slate-800/70 text-center font-semibold text-slate-900';
          const val = item.prices && item.prices[key];
          const disp = (val === undefined || val === null || val === '')
            ? ''
            : String(val).replace('.', ',');
          td.textContent = disp;
          tr.appendChild(td);
        });

        tr.addEventListener('click', (e) => {
          if (e.target.closest('.row-checkbox')) {
            handleRowClick(e, itemKey);
            return;
          }
          handleRowClick(e, itemKey);
        });

        menuTbodyEl.appendChild(tr);
      });
    });
  });

  updateTableInfo(filteredItems.length);
  exportBtn.disabled = false;
  updateRowRangeSelectionStyles();
  applyFontSize();
}

// Получить ссылку на картинку из item
function getPictureUrlFromItem(item) {
  const sizes = Array.isArray(item.itemSizes) ? item.itemSizes : [];
  if (Array.isArray(item.imageUrls) && item.imageUrls.length) return item.imageUrls[0];
  if (Array.isArray(item.seoImageUrls) && item.seoImageUrls.length) return item.seoImageUrls[0];
  for (const sz of sizes) {
    if (sz.buttonImageUrl) return sz.buttonImageUrl;
    if (sz.imageUrl) return sz.imageUrl;
  }
  if (Array.isArray(item.imageLinks) && item.imageLinks.length) {
    const il = item.imageLinks[0];
    return il.imageUrl || il.url || '';
  }
  if (item.imageUrl) return item.imageUrl;
  return '';
}

// Собрать позиции из menu.by_id по выбранным организациям и ЦК
function collectItemsFromMenuById(menuData, orgIds, priceCategoryId = null) {
  const resultMap = new Map();
  const orgSet = new Set(orgIds);

  const categories = Array.isArray(menuData.itemCategories) ? menuData.itemCategories : [];
  categories.forEach(cat => {
    const catName = cat.name || '';
    const items = Array.isArray(cat.items) ? cat.items : [];
    items.forEach(item => {
      const code = item.sku || item.code || '';
      const name = item.name || '';
      const externalName = item.externalName || item.seoText || item.description || '';
      const sizes = Array.isArray(item.itemSizes) ? item.itemSizes : [];
      const picture = getPictureUrlFromItem(item);

      if (!sizes.length) {
        const key = code + '|';
        if (!resultMap.has(key)) {
          resultMap.set(key, {
            code,
            name,
            externalName,
            categoryPath: catName,
            sizeName: '',
            prices: {},
            imageUrl: picture
          });
        }
        return;
      }

      sizes.forEach(size => {
        const sizeName = size.sizeName || size.name || '';
        const key = code + '|' + sizeName;
        let row = resultMap.get(key);
        if (!row) {
          row = {
            code,
            name,
            externalName,
            categoryPath: catName,
            sizeName,
            prices: {},
            imageUrl: picture
          };
          resultMap.set(key, row);
        }

        const prices = Array.isArray(size.prices) ? size.prices : [];
        prices.forEach(p => {
          const orgId = p.organizationId;
          if (!orgId || !orgSet.has(orgId)) return;
          if (priceCategoryId && p.priceCategoryId && p.priceCategoryId !== priceCategoryId) return;

          let val = p.price;
          if (typeof val !== 'number') val = Number(val || 0) || '';
          row.prices[orgId] = val;
        });
      });
    });
  });

  return Array.from(resultMap.values());
}

// === Таблица сверки цен: управление набором ===
function updateSelectionCountBadge() {
  if (!modeSelectionBtn) return;
  const base = 'Таблица сверки цен';
  const count = selectionItems.size;
  if (count > 0) {
    modeSelectionBtn.innerHTML = `${base} <span class="count-pill green ml-1">${count}</span>`;
  } else {
    modeSelectionBtn.textContent = base;
  }
}

// Переключение режимов
function updateModeButtons() {
  modeOrgsAllBtn.classList.toggle('mode-btn-active', viewMode === 'orgsAll');
  modeOrgsBtn.classList.toggle('mode-btn-active', viewMode === 'orgs');
  modePriceCatsBtn.classList.toggle('mode-btn-active', viewMode === 'priceCats');
  modeSelectionBtn.classList.toggle('mode-btn-active', viewMode === 'selection');

  if (viewMode === 'orgs') {
    pcSingleWrapper.classList.remove('hidden');
    pcMultiWrapper.classList.add('hidden');
    if (priceCategories.length) renderPcSingle();
  } else {
    pcSingleWrapper.classList.add('hidden');
    pcMultiWrapper.classList.remove('hidden');
    if (priceCategories.length && (viewMode === 'orgsAll' || viewMode === 'priceCats' || viewMode === 'selection')) {
      renderPcMulti();
    }
  }

  const isSelection = viewMode === 'selection';
  if (selectionToolsGroup && openSelectionSearchBtn && clearSelectionBtn) {
    selectionToolsGroup.classList.toggle('hidden', !isSelection);
    openSelectionSearchBtn.classList.toggle('hidden', !isSelection);
    clearSelectionBtn.classList.toggle('hidden', !isSelection);
  }

  updateSelectionCountBadge();
}

function switchViewMode(newMode) {
  if (viewMode === newMode) return;

  modeSelection[viewMode] = new Set(selectedOrgIds);

  viewMode = newMode;
  updateModeButtons();

  if (viewMode !== 'priceCats' && viewMode !== 'selection') {
    const basePc = priceCategories.find(pc => (pc.name || '').toLowerCase() === DEFAULT_PC_NAME.toLowerCase());
    if (priceCategories.length && (selectedPcIdsMulti.size === priceCategories.length || !selectedPcIdsMulti.size)) {
      const fallback = basePc ? basePc.id : priceCategories[0].id;
      selectedPcIdsMulti = new Set(fallback ? [fallback] : []);
    }
  }

  const savedOrgs = modeSelection[viewMode];

  if (savedOrgs && savedOrgs.size) {
    selectedOrgIds = new Set(savedOrgs);
  } else if (viewMode === 'selection' && organizations.length) {
    selectedOrgIds = new Set(organizations.map(o => o.id));
  } else {
    selectedOrgIds = new Set(savedOrgs || []);
  }

  selectedRowKeys.clear();
  lastSelectedRowKey = null;
  updateCitySelectionView();
  collapsedCities.clear();
  collapsedCategories.clear();

  const st = modeState[newMode];
  if (st && st.loaded) {
    allItems = st.items.slice();
    tableColumnLabels = st.labels.slice();
    tableColumnKeys = st.keys.slice();
    filterPerPc = {};
    filterAnyPrice = false;
    buildTableHeader();
    renderTable();
    loadImagesBtn.disabled = false;
  } else if (newMode === 'selection') {
    buildSelectionPreloadHeader();
    updateSelectionPreloadFromSelectionItems();
    loadImagesBtn.disabled = true;
  } else {
    allItems = [];
    tableColumnLabels = [];
    tableColumnKeys = [];
    filterPerPc = {};
    filterAnyPrice = false;
    menuTheadEl.innerHTML = '';
    menuTbodyEl.innerHTML = '';
    exportBtn.disabled = true;
    loadImagesBtn.disabled = true;
    updateTableInfo(0);
  }
  saveSessionSnapshot();
}

modeOrgsAllBtn.addEventListener('click', () => switchViewMode('orgsAll'));
modeOrgsBtn.addEventListener('click',      () => switchViewMode('orgs'));
modePriceCatsBtn.addEventListener('click', () => switchViewMode('priceCats'));
modeSelectionBtn.addEventListener('click', () => switchViewMode('selection'));

selectAllCitiesBtn.addEventListener('click', selectAllCities);
clearCitiesBtn.addEventListener('click',     clearCities);

if (citySearchInput) {
  citySearchInput.addEventListener('input', () => {
    citySearchTerm = citySearchInput.value || '';
    if (cityModalSearch && isCityModalOpen) cityModalSearch.value = citySearchTerm;
    renderOrganizations();
  });
}

if (cityModalSearch) {
  cityModalSearch.addEventListener('input', () => {
    citySearchTerm = cityModalSearch.value || '';
    if (citySearchInput) citySearchInput.value = citySearchTerm;
    renderOrganizations();
  });
}

if (cityModalList) {
  cityModalList.addEventListener('scroll', handleCityModalScroll, { passive: true });
}

if (mobileCityBtn && cityModal) {
  mobileCityBtn.addEventListener('click', openCityModal);
}

if (closeCityModal && cityModal) {
  closeCityModal.addEventListener('click', closeCityModalWindow);
}

if (cityModalBackdrop) {
  cityModalBackdrop.addEventListener('click', (e) => {
    if (e.target === cityModalBackdrop) {
      closeCityModalWindow();
    }
  });
}

if (cityModalApply) {
  cityModalApply.addEventListener('click', () => {
    selectedOrgIds = new Set(cityModalSelection);
    modeSelection[viewMode] = new Set(selectedOrgIds);
    closeCityModalWindow();
    updateCitySelectionView();
  });
}

if (cityModalSelectAll) {
  cityModalSelectAll.addEventListener('click', (e) => {
    e.preventDefault();
    selectAllCities();
    if (isCityModalOpen) {
      cityModalSelection = new Set(selectedOrgIds);
      updateCityModalFooter();
      renderOrganizations();
    }
  });
}

if (cityModalClear) {
  cityModalClear.addEventListener('click', (e) => {
    e.preventDefault();
    clearCities();
    if (isCityModalOpen) {
      cityModalSelection = new Set();
      updateCityModalFooter();
    }
  });
}

filterAnyPriceBtn.addEventListener('click', () => {
  filterAnyPrice = !filterAnyPrice;
  updateFilterAnyPriceBtn();
  renderTable();
  saveSessionSnapshot();
});

fontSmallerBtn.addEventListener('click', () => {
  currentFontSize = Math.max(11, currentFontSize - 1);
  applyFontSize();
  saveSessionSnapshot();
});
fontBiggerBtn.addEventListener('click', () => {
  currentFontSize = Math.min(18, currentFontSize + 1);
  applyFontSize();
  saveSessionSnapshot();
});

toggleDescriptionBtn.addEventListener('click', () => {
  showDescriptionColumn = !showDescriptionColumn;
  toggleDescriptionBtn.textContent = showDescriptionColumn ? 'Описание −' : 'Описание +';

  if (viewMode === 'selection' && !modeState.selection.loaded) {
    buildSelectionPreloadHeader();
    renderSelectionPreloadBody();
  } else if (viewMode === 'selection' && modeState.selection.loaded) {
    buildTableHeader();
    renderTable();
  } else if (!tableColumnKeys.length && !tableColumnLabels.length) {
    // пока нет данных — ничего, кнопка просто переключилась
  } else {
    buildTableHeader();
    renderTable();
  }
  saveSessionSnapshot();
});

// === Поиск блюд (модалка) ===
// Индекс для поиска
async function ensureMenuSearchIndex() {
  let baseItems = [];
  if (modeState.orgsAll.loaded && modeState.orgsAll.items.length) {
    baseItems = modeState.orgsAll.items;
  } else if (allItems.length) {
    baseItems = allItems;
  } else {
    throw new Error('Сначала загрузите меню (например, режим «Цены по городам (все ЦК)»).');
  }

  const tmp = new Map();
  menuSearchIndex = [];
  menuSearchIndexMap = new Map();

  baseItems.forEach(item => {
    const code = item.code || '';
    const name = item.name || '';
    const externalName = item.externalName || '';
    const sizeName = item.sizeName || '';
    const key = code + '|' + sizeName;
    if (!code || tmp.has(key)) return;
    const row = {
      key,
      code,
      name,
      externalName,
      sizeName,
      categoryPath: item.categoryPath || '',
      imageUrl: item.imageUrl || '',
      source: 'web'
    };
    row.codeLc = code.toLowerCase();
    row.nameLc = name.toLowerCase();
    row.extLc  = externalName.toLowerCase();
    tmp.set(key, row);
    menuSearchIndex.push(row);
    menuSearchIndexMap.set(key, row);
  });
}

// Поиск по индексу
function searchInMenuIndex(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  const res = [];
  for (const row of menuSearchIndex) {
    if (row.codeLc.includes(q) || row.nameLc.includes(q) || row.extLc.includes(q)) {
      res.push(row);
      if (res.length >= 70) break;
    }
  }
  return res;
}

// Рендер результатов поиска (4 колонки: Фото | Категория | Наименование | SKU)
function renderDishSearchResults(results, query) {
  if (!dishSearchResultsEl) return;
  if (!results.length) {
    dishSearchResultsEl.innerHTML =
      '<div class="px-3 py-2 text-xs text-slate-500">По загруженному меню ничего не найдено.</div>';
    return;
  }

  const q = query || '';
  const parts = results.map(row => {
    const inSelection = selectionItems.has(row.key);
    const sizePart = row.sizeName ? ` (${escapeHtml(row.sizeName)})` : '';
    const title = row.externalName || row.name || '';
    const nameHtml = highlightMatch(title, q);
    const skuHtml  = highlightMatch(row.code || '', q);
    const catHtml  = escapeHtml(row.categoryPath || '');

    const realImg = `/img?url=${encodeURIComponent(row.imageUrl || '')}&thumb=1`;
    const imageHtml = row.imageUrl
      ? `<img data-lazy-src="${realImg}"
               src="${LAZY_PLACEHOLDER}"
               data-image-url="/img?url=${encodeURIComponent(row.imageUrl)}"
               class="w-10 h-10 rounded-md object-cover border border-slate-200 bg-slate-50"
               loading="lazy" decoding="async" />`
      : `<div class="w-10 h-10 rounded-md border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
           нет фото
         </div>`;

    return `
      <button type="button"
              class="dish-search-row ${inSelection ? 'dish-search-row-selected' : ''}"
              data-item-key="${escapeHtml(row.key)}">
        <div class="grid grid-cols-[3rem_1.4fr_1.8fr_1.1fr] items-center gap-2 px-3 py-1.5">
          <div class="flex items-center justify-center">
            ${imageHtml}
          </div>
          <div class="text-[11px] text-slate-600 break-words text-center">
            ${catHtml}
          </div>
          <div class="flex flex-col gap-0.5">
            <div class="dish-name text-[13px] font-semibold text-slate-900 text-center">
              ${nameHtml}${sizePart}
            </div>
            <div class="text-[11px] text-emerald-600 text-center">
              ${inSelection ? 'В таблице сверки цен' : ''}
            </div>
          </div>
          <div class="text-[11px] text-slate-700 font-mono text-center">
            ${skuHtml}
          </div>
        </div>
      </button>`;
  });

  dishSearchResultsEl.innerHTML = parts.join('');

  dishSearchResultsEl.querySelectorAll('img[data-lazy-src]').forEach(img => {
    registerLazyImage(img, img.dataset.lazySrc);
  });
}

// Добавить позиции в таблицу сверки
function addItemKeysToSelection(keys) {
  if (!Array.isArray(keys) || !keys.length) return;
  let added = 0;

  keys.forEach(itemKey => {
    if (!itemKey) return;
    if (selectionItems.has(itemKey)) return;

    let base = null;

    if (Array.isArray(allItems) && allItems.length) {
      base = allItems.find(i => (i.code + '|' + (i.sizeName || '')) === itemKey) || null;
    }

    if (!base && menuSearchIndexMap && menuSearchIndexMap.has(itemKey)) {
      const row = menuSearchIndexMap.get(itemKey);
      base = {
        code: row.code,
        name: row.name,
        externalName: row.externalName,
        categoryPath: row.categoryPath,
        sizeName: row.sizeName,
        imageUrl: row.imageUrl
      };
    }

    if (!base) return;

    selectionItems.set(itemKey, {
      code: base.code,
      name: base.name,
      externalName: base.externalName || '',
      categoryPath: base.categoryPath || '',
      sizeName: base.sizeName || '',
      imageUrl: base.imageUrl || ''
    });
    added++;
  });

  updateSelectionCountBadge();

  if (!added) {
    if (viewMode === 'selection') updateTableInfo(allItems.length || 0);
    setStatus('Выбранные блюда уже есть в таблице сверки цен.', 'info');
    updateRowRangeSelectionStyles();
    return;
  }

  if (viewMode === 'selection' && !modeState.selection.loaded) {
    updateSelectionPreloadFromSelectionItems();
    setStatus(`Добавлено блюд в таблицу сверки цен: ${added}. Нажмите «Загрузить меню и цены» для получения цен.`, 'success');
  } else {
    setStatus(`Добавлено блюд в таблицу сверки цен: ${added}. Перейдите в режим «Таблица сверки цен» и нажмите «Загрузить меню и цены» для получения цен.`, 'success');
  }

  updateRowRangeSelectionStyles();
  saveSessionSnapshot();
}

// Удалить позиции из таблицы сверки
function removeItemKeysFromSelection(keys) {
  if (!Array.isArray(keys) || !keys.length) return;
  let removed = 0;
  keys.forEach(k => {
    if (selectionItems.delete(k)) removed++;
  });
  if (!removed) return;

  if (modeState.selection && modeState.selection.loaded) {
    const removeSet = new Set(keys);
    modeState.selection.items = (modeState.selection.items || []).filter(row => {
      const rowKey = row.key || (row.code + '|' + (row.sizeName || ''));
      return !removeSet.has(rowKey);
    });
    modeState.selection.labels = modeState.selection.labels || tableColumnLabels.slice();
    modeState.selection.keys = modeState.selection.keys || tableColumnKeys.slice();
    modeState.selection.loaded = true;
  }

  selectedRowKeys.clear();
  lastSelectedRowKey = null;
  updateSelectionCountBadge();

  if (viewMode === 'selection') {
    if (modeState.selection && modeState.selection.loaded) {
      allItems = modeState.selection.items.slice();
      tableColumnLabels = modeState.selection.labels.slice();
      tableColumnKeys = modeState.selection.keys.slice();
      buildTableHeader();
      renderTable();
      exportBtn.disabled = !allItems.length;
      updateTableInfo(allItems.length);
    } else {
      buildSelectionPreloadHeader();
      renderSelectionPreloadBody();
      exportBtn.disabled = true;
      updateTableInfo(selectionItems.size);
    }
  }

  setStatus(`Из таблицы сверки цен удалено позиций: ${removed}. При необходимости заново загрузите цены.`, 'success');
  saveSessionSnapshot();
}

// Кнопка "Поиск блюд"
if (openSelectionSearchBtn) {
  let dishSearchDebounce;
  openSelectionSearchBtn.addEventListener('click', async () => {
    try {
      await ensureMenuSearchIndex();
      dishSearchInput.value = '';
      dishSearchResultsEl.innerHTML = '';
      dishSearchModal.classList.remove('hidden');
      dishSearchInput.focus();

      if (!dishSearchDebounce && dishSearchInput) {
        dishSearchInput.addEventListener('input', () => {
          const q = dishSearchInput.value || '';
          clearTimeout(dishSearchDebounce);
          dishSearchDebounce = setTimeout(() => {
            renderDishSearchResults(searchInMenuIndex(q), q);
          }, 200);
        });
      }
    } catch (e) {
      console.error(e);
      setStatus(`Ошибка подготовки поиска: ${e.message}`, 'error');
    }
  });
}

function closeDishSearchModal() {
  dishSearchModal.classList.add('hidden');
  if (dishSearchInput) dishSearchInput.value = '';
  if (dishSearchResultsEl) dishSearchResultsEl.innerHTML = '';
}

if (closeDishSearchBtn) {
  closeDishSearchBtn.addEventListener('click', () => {
    closeDishSearchModal();
  });
}
if (dishSearchModal) {
  dishSearchModal.addEventListener('click', (e) => {
    if (e.target === dishSearchModal) {
      closeDishSearchModal();
    }
  });
}

// Клик по результату поиска
if (dishSearchResultsEl) {
  dishSearchResultsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-item-key]');
    if (!btn) return;
    const key = btn.dataset.itemKey;

    if (selectionItems.has(key)) {
      removeItemKeysFromSelection([key]);
    } else {
      addItemKeysToSelection([key]);
    }

    const q = dishSearchInput ? dishSearchInput.value || '' : '';
    renderDishSearchResults(searchInMenuIndex(q), q);
  });
}

// Кнопка "Очистить таблицу"
if (clearSelectionBtn) {
  clearSelectionBtn.addEventListener('click', () => {
    selectionItems.clear();
    modeState.selection = { loaded: false, items: [], labels: [], keys: [] };
    selectedRowKeys.clear();
    lastSelectedRowKey = null;
    updateSelectionCountBadge();
    if (viewMode === 'selection') {
      buildSelectionPreloadHeader();
      renderSelectionPreloadBody();
      exportBtn.disabled = true;
      updateTableInfo(0);
    }
    setStatus('Таблица сверки цен очищена.', 'success');
  });
}

// Контекстное меню
if (menuTbodyEl && rowContextMenu && ctxAddToSelectionBtn) {
  const openContextMenuAt = (e, tr, cell) => {
    ctxLastItemKey = tr?.dataset.itemKey || null;
    if (!ctxLastItemKey) return;

    ctxCopyText  = '';
    ctxCopyLabel = 'Копировать значение';

    if (cell && cell.dataset.col) {
      const colType = cell.dataset.col;
      ctxCopyText = (cell.innerText || '').trim();
      if (colType === 'category') ctxCopyLabel = 'Копировать категорию';
      else if (colType === 'name') ctxCopyLabel = 'Копировать наименование';
      else if (colType === 'sku') ctxCopyLabel = 'Копировать SKU';
      else if (colType === 'description') ctxCopyLabel = 'Копировать описание';
    }

    ctxAddToSelectionBtn.textContent =
      viewMode === 'selection'
        ? 'Удалить из таблицы сверки цен'
        : 'Добавить в таблицу сверки цен';

    if (ctxCopyText) {
      ctxCopyValueBtn.classList.remove('hidden');
      ctxCopyValueBtn.textContent = ctxCopyLabel;
    } else {
      ctxCopyValueBtn.classList.add('hidden');
    }

    rowContextMenu.style.left = `${e.clientX}px`;
    rowContextMenu.style.top  = `${e.clientY}px`;
    rowContextMenu.classList.remove('hidden');
  };

  menuTbodyEl.addEventListener('contextmenu', (e) => {
    const tr = e.target.closest('tr[data-item-key]');
    if (!tr) return;
    e.preventDefault();
    const cell = e.target.closest('td,th');
    openContextMenuAt(e, tr, cell);
  });

  menuTbodyEl.addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'touch') return;
    const tr = e.target.closest('tr[data-item-key]');
    if (!tr) return;
    const cell = e.target.closest('td,th');
    openContextMenuAt(e, tr, cell);
  });

  ctxAddToSelectionBtn.addEventListener('click', () => {
    rowContextMenu.classList.add('hidden');
    if (!ctxLastItemKey) return;

    const keys =
      selectedRowKeys.size > 0
        ? Array.from(selectedRowKeys)
        : [ctxLastItemKey];

    if (viewMode === 'selection') {
      const shortKeys = keys.map(k => {
        const parts = k.split('||');
        const tail = parts[parts.length - 1];
        return tail.includes('|') ? tail : tail;
      });
      removeItemKeysFromSelection(shortKeys);
    } else {
      addItemKeysToSelection(keys.map(k => {
        const parts = k.split('||');
        return parts[parts.length - 1];
      }));
    }
  });

  ctxCopyValueBtn.addEventListener('click', async () => {
    rowContextMenu.classList.add('hidden');
    if (!ctxCopyText) return;
    try {
      await navigator.clipboard.writeText(ctxCopyText);
      setStatus('Значение скопировано в буфер обмена.', 'success');
    } catch (e) {
      console.error(e);
      setStatus('Не удалось скопировать в буфер обмена.', 'error');
    }
  });

  document.addEventListener('click', () => {
    rowContextMenu.classList.add('hidden');
  });
}

if (menuTheadEl) {
  menuTheadEl.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('button[data-role="toggle-rows"]');
    if (toggleBtn) {
      const rows = menuTbodyEl ? menuTbodyEl.querySelectorAll('tr[data-item-key]') : [];
      const total = rows ? rows.length : 0;
      if (!total) return;
      if (selectedRowKeys.size < total) selectAllVisibleRows();
      else clearAllRowSelections();
      return;
    }
  });
}

if (menuTbodyEl) {
  const toggleHandler = (e) => {
    const cityRow = e.target.closest('tr.group-city-row');
    if (cityRow && cityRow.dataset.city) {
      e.preventDefault();
      e.stopImmediatePropagation();
      const cityLabel = cityRow.dataset.city;
      if (collapsedCities.has(cityLabel)) collapsedCities.delete(cityLabel);
      else collapsedCities.add(cityLabel);
      renderTable();
      return true;
    }

    const catRow = e.target.closest('tr.group-category-row');
    if (catRow) {
      e.preventDefault();
      e.stopImmediatePropagation();
      const catKey = catRow.dataset.catKey || catRow.dataset.category;
      if (catKey) {
        if (collapsedCategories.has(catKey)) collapsedCategories.delete(catKey);
        else collapsedCategories.add(catKey);
        renderTable();
        return true;
      }
    }
    return false;
  };

  menuTbodyEl.addEventListener('pointerdown', (e) => {
    if (toggleHandler(e)) return;
  }, true);

  menuTbodyEl.addEventListener('mousedown', (e) => {
    if (toggleHandler(e)) return;
  }, true);

  menuTbodyEl.addEventListener('click', (e) => {
    toggleHandler(e);
  });

  const openFromTarget = (e) => {
    const img = e.target.closest('[data-gallery-index]');
    if (!img) return;
    e.stopPropagation();
    let idx = Number(img.dataset.galleryIndex ?? -1);

    if (!Number.isInteger(idx) || idx < 0 || !imageModalState.list[idx]) {
      const entry = {
        key: img.dataset.imageKey || img.dataset.sku || img.dataset.rawUrl || img.dataset.fullUrl,
        url: img.dataset.fullUrl || '',
        rawUrl: img.dataset.rawUrl || '',
        name: img.dataset.name || '',
        sizeName: img.dataset.size || '',
        sku: img.dataset.sku || '',
        description: img.dataset.description || ''
      };
      idx = registerImageEntry(entry);
    }

    openImageModalByIndex(idx);
  };
  menuTbodyEl.addEventListener('click', openFromTarget);
  menuTbodyEl.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'touch') openFromTarget(e);
  });
}

document.addEventListener('click', (e) => {
  const img = e.target.closest('[data-gallery-index]');
  if (!img) return;
  let idx = Number(img.dataset.galleryIndex ?? -1);
  if (!Number.isInteger(idx) || idx < 0 || !imageModalState.list[idx]) {
    const entry = {
      key: img.dataset.imageKey || img.dataset.sku || img.dataset.rawUrl || img.dataset.fullUrl,
      url: img.dataset.fullUrl || '',
      rawUrl: img.dataset.rawUrl || '',
      name: img.dataset.name || '',
      sizeName: img.dataset.size || '',
      sku: img.dataset.sku || '',
      description: img.dataset.description || ''
    };
    idx = registerImageEntry(entry);
  }
  openImageModalByIndex(idx);
});

// === Загрузка организаций + меню ===
async function loadOrganizationsAndMenus() {
  try {
    startButtonLoading(loadOrgsBtn, 'Подключение');
    setButtonProgress(loadOrgsBtn, 0.0);
    setStatus('Загрузка организаций...', 'info');

    // Сброс
    organizations = [];
    externalMenus = [];
    priceCategories = [];
    selectedOrgIds.clear();
    orgsListEl.innerHTML = '';
    menuSelectEl.innerHTML = '<option value="">Загрузка...</option>';
    priceCategorySingle.innerHTML = '<option value="">Выберите ЦК</option>';
    pcSingleChips.innerHTML = '';
    pcMultiChips.innerHTML = '';
    allItems = [];
    tableColumnLabels = [];
    tableColumnKeys = [];
    filterPerPc = {};
    filterAnyPrice = false;
    menuTheadEl.innerHTML = '';
    menuTbodyEl.innerHTML = '';
    exportBtn.disabled = true;
    collapsedCities.clear();
    collapsedCategories.clear();
    modeState = {
      orgsAll:   { loaded: false, items: [], labels: [], keys: [] },
      orgs:      { loaded: false, items: [], labels: [], keys: [] },
      priceCats: { loaded: false, items: [], labels: [], keys: [], orgId: null },
      selection: { loaded: false, items: [], labels: [], keys: [] }
    };
    modeSelection = {
      orgsAll:   new Set(),
      orgs:      new Set(),
      priceCats: new Set(),
      selection: new Set()
    };
    selectionItems.clear();
    selectedRowKeys.clear();
    lastSelectedRowKey = null;
    menuSearchIndex = [];
    menuSearchIndexMap = new Map();
    updateSelectionCountBadge();

    viewMode = 'orgsAll';
    updateModeButtons();
    loadImagesBtn.disabled = true;
    currentPriceCategoryId = null;

    // organizations
    const orgResp = await callBackend('organizations', 1, { returnAdditionalInfo: true });
    organizations = Array.isArray(orgResp.organizations) ? orgResp.organizations.filter(o => !o.isDeleted) : [];
    citySearchTerm = citySearchInput ? citySearchInput.value || '' : '';
    renderOrganizations();

    if (restoredSession && Array.isArray(restoredSession.selectedOrgIds)) {
      selectedOrgIds = new Set(restoredSession.selectedOrgIds.filter(id => organizations.some(o => o.id === id)));
    } else {
      selectedOrgIds = new Set(organizations.map(o => o.id));
    }
    modeSelection[viewMode] = new Set(selectedOrgIds);
    updateCitySelectionView();
    setButtonProgress(loadOrgsBtn, 0.4);
    setStatus(`Организаций загружено: ${organizations.length}`, 'success');

    if (!organizations.length) {
      finishButtonLoading(loadOrgsBtn);
      return;
    }

    // меню + ЦК
    setStatus('Загрузка внешних меню и ценовых категорий...', 'info');
    const refOrgId = organizations[0].id;
    const menuResp = await callBackend('menu', 2, { organizationIds: [refOrgId] });
    externalMenus = Array.isArray(menuResp.externalMenus) ? menuResp.externalMenus : [];
    priceCategories = normalizePriceCategories(menuResp.priceCategories);

    const desiredMenuId = (restoredSession && restoredSession.currentMenuId && externalMenus.some(m => m.id === restoredSession.currentMenuId))
      ? restoredSession.currentMenuId
      : null;
    renderMenus(desiredMenuId);
    renderPriceCategoriesSingle();
    renderPcSingle();
    renderPcMulti();

    if (restoredSession) {
      if (restoredSession.currentMenuId) {
        currentMenuId = restoredSession.currentMenuId;
        menuSelectEl.value = currentMenuId;
      }
      if (Array.isArray(restoredSession.selectedPcIdsMulti)) {
        selectedPcIdsMulti = new Set(restoredSession.selectedPcIdsMulti.filter(id => priceCategories.find(pc => pc.id === id)));
        updatePcMultiChipsUI();
      }
      if (restoredSession.currentPriceCategoryId && priceCategories.find(pc => pc.id === restoredSession.currentPriceCategoryId)) {
        currentPriceCategoryId = restoredSession.currentPriceCategoryId;
        renderPcSingle();
      }
      if (typeof restoredSession.showDescriptionColumn === 'boolean') {
        showDescriptionColumn = restoredSession.showDescriptionColumn;
        toggleDescriptionBtn.textContent = showDescriptionColumn ? 'Описание −' : 'Описание +';
      }
      if (restoredSession.currentFontSize) {
        currentFontSize = restoredSession.currentFontSize;
        applyFontSize();
      }
      if (restoredSession.modeSelection) {
        modeSelection = {
          orgsAll: new Set(restoredSession.modeSelection.orgsAll || []),
          orgs: new Set(restoredSession.modeSelection.orgs || []),
          priceCats: new Set(restoredSession.modeSelection.priceCats || []),
          selection: new Set(restoredSession.modeSelection.selection || [])
        };
      }
      if (restoredSession.selectionItems) {
        selectionItems.clear();
        restoredSession.selectionItems.forEach(([k, v]) => selectionItems.set(k, v));
        updateSelectionCountBadge();
      }
      if (restoredSession.viewMode) {
        viewMode = restoredSession.viewMode;
        updateModeButtons();
      }
    }

    setApiStatus(true);
    setButtonProgress(loadOrgsBtn, 1.0);
    setStatus(`Организаций: ${organizations.length}, внешних меню: ${externalMenus.length}, ЦК: ${priceCategories.length}`, 'success');
    saveSessionSnapshot();
    finishButtonLoading(loadOrgsBtn);
    syncImageButtonAvailability();
  } catch (e) {
    console.error(e);
    setStatus(`Ошибка: ${e.message}`, 'error');
    setApiStatus(false);
    finishButtonLoading(loadOrgsBtn);
    syncImageButtonAvailability();
  }
}

loadOrgsBtn.addEventListener('click', loadOrganizationsAndMenus);

// Выход
logoutBtn.addEventListener('click', () => {
  try {
    localStorage.removeItem('iikoApiLogin');
  } catch (e) {
    console.warn('localStorage unavailable', e);
  }
  try {
    sessionStorage.removeItem(INDEX_SESSION_FLAG);
    sessionStorage.removeItem('yandexSessionAlive');
  } catch (e) {
    console.warn('Не удалось очистить маркеры сессии', e);
  }
  apiKeyInput.value = '';
  setApiStatus(false);
  setStatus('Вы вышли. Введите apiLogin и нажмите «Подключить iiko API».', 'info');
  clearSessionStorage();

  organizations = [];
  externalMenus = [];
  priceCategories = [];
  selectedOrgIds.clear();
  orgsListEl.innerHTML = '';
  menuSelectEl.innerHTML = '<option value="">Сначала загрузите организации и меню</option>';
  priceCategorySingle.innerHTML = '<option value="">Выберите ЦК</option>';
  pcSingleChips.innerHTML = '';
  pcMultiChips.innerHTML = '';
  allItems = [];
  tableColumnLabels = [];
  tableColumnKeys = [];
  filterPerPc = {};
  filterAnyPrice = false;
  menuTheadEl.innerHTML = '';
  menuTbodyEl.innerHTML = '';
  exportBtn.disabled = true;
  collapsedCities.clear();
  collapsedCategories.clear();
  modeState = {
    orgsAll:   { loaded: false, items: [], labels: [], keys: [] },
    orgs:      { loaded: false, items: [], labels: [], keys: [] },
    priceCats: { loaded: false, items: [], labels: [], keys: [], orgId: null },
    selection: { loaded: false, items: [], labels: [], keys: [] }
  };
  modeSelection = {
    orgsAll:   new Set(),
    orgs:      new Set(),
    priceCats: new Set(),
    selection: new Set()
  };
  selectionItems.clear();
  selectedRowKeys.clear();
  lastSelectedRowKey = null;
  menuSearchIndex = [];
  menuSearchIndexMap = new Map();

  viewMode = 'orgsAll';
  currentPriceCategoryId = null;
  updateModeButtons();
  updateTableInfo(0);
  loadImagesBtn.disabled = true;
  window.location.reload();
});

function resetAllState() {
  filterCategoryActive = '';
  filterNameActive = '';
  filterCodeActive = '';
  filterPerPc = {};
  filterAnyPrice = false;
  collapsedCities.clear();
  collapsedCategories.clear();

  selectionItems.clear();
  modeState.selection = { loaded: false, items: [], labels: [], keys: [] };
  selectedRowKeys.clear();
  lastSelectedRowKey = null;
  updateSelectionCountBadge();

  const basePc = priceCategories.find(pc => (pc.name || '').toLowerCase() === DEFAULT_PC_NAME.toLowerCase());
  currentPriceCategoryId = basePc ? basePc.id : null;
  selectedPcIdsMulti = new Set();
  if (basePc) selectedPcIdsMulti.add(basePc.id);
  else priceCategories.forEach(pc => selectedPcIdsMulti.add(pc.id));

  viewMode = 'orgsAll';
  updateModeButtons();

  selectedOrgIds = new Set(organizations.map(o => o.id));
  updateCitySelectionView();

  filterAnyPrice = false;
  buildTableHeader();
  renderTable();
  exportBtn.disabled = true;
  saveSessionSnapshot();
  setStatus('Все настройки сброшены: фильтры очищены, выбраны все города и базовая ценовая категория.', 'success');
}

if (resetAllBtn) {
  resetAllBtn.addEventListener('click', resetAllState);
}

// === Загрузка меню и цен ===
loadMenuBtn.addEventListener('click', async () => {
  try {
    if (!currentMenuId) {
      setStatus('Выберите внешнее меню.', 'error');
      return;
    }

    if (viewMode === 'orgsAll' || viewMode === 'orgs' || viewMode === 'selection') {
      if (!selectedOrgIds.size) {
        setStatus('Выберите минимум один город слева.', 'error');
        return;
      }
    }
    if (viewMode === 'priceCats' && selectedOrgIds.size !== 1) {
      setStatus('Для режима "Город (все ЦК)" выберите ровно один город.', 'error');
      return;
    }

    const selectedPcIdsMultiArr = getSelectedPcIdsForMulti();
    if ((viewMode === 'orgsAll' || viewMode === 'priceCats' || viewMode === 'selection') && !selectedPcIdsMultiArr.length) {
      setStatus('Выберите хотя бы одну ценовую категорию.', 'error');
      return;
    }
    if (viewMode === 'orgs' && !currentPriceCategoryId) {
      setStatus('Выберите ценовую категорию (чипами).', 'error');
      return;
    }

    collapsedCities.clear();
    collapsedCategories.clear();
    allItems = [];
    menuTbodyEl.innerHTML = '';
    exportBtn.disabled = true;
    loadImagesBtn.disabled = true;
    filterPerPc = {};
    filterAnyPrice = false;
    selectedRowKeys.clear();
    lastSelectedRowKey = null;

    startButtonLoading(loadMenuBtn, 'Загрузка');
    setButtonProgress(loadMenuBtn, 0.1);

    // ---- orgs: города по одной ЦК ----
    if (viewMode === 'orgs') {
      const orgIds = Array.from(selectedOrgIds);
      const cityNames = mapOrgsToCityNames(orgIds);
      tableColumnKeys = orgIds.slice();
      tableColumnLabels = cityNames.slice();
      filterPerPc = {};
      tableColumnKeys.forEach(k => filterPerPc[k] = false);
      filterAnyPrice = false;

      buildTableHeader();
      const baseCount = getBaseColumnCount();
      menuTbodyEl.innerHTML = `
        <tr>
          <td colspan="${baseCount + cityNames.length}" class="px-3 py-3 text-center text-[12px] text-slate-400">
            Загрузка меню и цен для выбранных городов...
          </td>
        </tr>`;

      setStatus('Загрузка меню по /api/2/menu/by_id (режим: Цены по городам выбранной ЦК)...', 'info');

      setButtonProgress(loadMenuBtn, 0.4);
      const payload = {
        externalMenuId: currentMenuId,
        organizationIds: orgIds,
        language: 'ru',
        asyncMode: false,
        startRevision: 0,
        priceCategoryId: currentPriceCategoryId || null
      };
      lastMenuPayload = { endpoint: 'menu/by_id', version: 2, payload: { ...payload } };
      const menuResp = await callBackend('menu/by_id', 2, payload);
      allItems = collectItemsFromMenuById(menuResp, orgIds, currentPriceCategoryId || null);
      modeState.orgs = {
        loaded: true,
        items: allItems.slice(),
        labels: tableColumnLabels.slice(),
        keys: tableColumnKeys.slice()
      };

      setButtonProgress(loadMenuBtn, 1.0);
      imageVersion++;
      renderTable();
      setStatus(`Загружено позиций: ${allItems.length}`, 'success');

    // ---- priceCats: один город, несколько ЦК ----
    } else if (viewMode === 'priceCats') {
      const orgId = Array.from(selectedOrgIds)[0];
      const orgLabel = mapOrgsToCityNames([orgId])[0] || 'Город';

      tableColumnKeys = selectedPcIdsMultiArr.slice();
      tableColumnLabels = selectedPcIdsMultiArr.map(pcId => {
        const pc = priceCategories.find(p => p.id === pcId);
        return pc ? (pc.name || pc.id) : pcId;
      });
      filterPerPc = {};
      tableColumnKeys.forEach(k => filterPerPc[k] = false);
      filterAnyPrice = false;
      buildTableHeader();

      const baseCount = getBaseColumnCount();
      menuTbodyEl.innerHTML = `
        <tr>
          <td colspan="${baseCount + tableColumnLabels.length}" class="px-3 py-3 text-center text-[12px] text-slate-400">
            Загрузка меню и выбранных ЦК для города ${escapeHtml(orgLabel)}...
          </td>
        </tr>`;

      setStatus('Загрузка меню по /api/2/menu/by_id (режим: Город (все ЦК))...', 'info');

      const combinedMap = new Map();
      const totalReq = selectedPcIdsMultiArr.length || 1;
      let doneReq = 0;

      for (const pcId of selectedPcIdsMultiArr) {
        const payload = {
          externalMenuId: currentMenuId,
          organizationIds: [orgId],
          language: 'ru',
          asyncMode: false,
          startRevision: 0,
          priceCategoryId: pcId
        };
        lastMenuPayload = { endpoint: 'menu/by_id', version: 2, payload: { ...payload } };
        const menuResp = await callBackend('menu/by_id', 2, payload);
        const itemsForPc = collectItemsFromMenuById(menuResp, [orgId], pcId);

        itemsForPc.forEach(it => {
          const key = it.code + '|' + (it.sizeName || '');
          let row = combinedMap.get(key);
          const priceForOrg = (it.prices && it.prices[orgId]) || '';
          if (!row) {
            row = {
              code: it.code,
              name: it.name,
              externalName: it.externalName || '',
              categoryPath: it.categoryPath,
              sizeName: it.sizeName,
              prices: {},
              imageUrl: it.imageUrl
            };
            combinedMap.set(key, row);
          }
          row.prices[pcId] = priceForOrg;
        });

        doneReq += 1;
        setButtonProgress(loadMenuBtn, 0.1 + 0.8 * (doneReq / totalReq));
      }

      allItems = Array.from(combinedMap.values());
      modeState.priceCats = {
        loaded: true,
        items: allItems.slice(),
        labels: tableColumnLabels.slice(),
        keys: tableColumnKeys.slice(),
        orgId
      };

      imageVersion++;
      renderTable();
      setStatus(`Загружено позиций: ${allItems.length}`, 'success');

    // ---- selection: таблица сверки с ценами ----
    } else if (viewMode === 'selection') {
      const orgIds = Array.from(selectedOrgIds);
      if (!orgIds.length) {
        throw new Error('Выберите минимум один город.');
      }
      if (!selectionItems.size) {
        throw new Error('В таблице сверки цен нет ни одного блюда. Добавьте блюда через поиск или контекстное меню.');
      }

      const selectedPcIds = selectedPcIdsMultiArr;
      if (!selectedPcIds.length) {
        throw new Error('Выберите хотя бы одну ценовую категорию.');
      }

      tableColumnKeys = selectedPcIds.slice();
      tableColumnLabels = selectedPcIds.map(pcId => {
        const pc = priceCategories.find(p => p.id === pcId);
        return pc ? (pc.name || pc.id) : pcId;
      });
      filterPerPc = {};
      tableColumnKeys.forEach(k => filterPerPc[k] = false);
      filterAnyPrice = false;
      buildTableHeader();

      const baseCount = getBaseColumnCount();
      const cityNames = mapOrgsToCityNames(orgIds);
      menuTbodyEl.innerHTML = `
        <tr>
          <td colspan="${baseCount + tableColumnLabels.length}"
              class="px-3 py-3 text-center text-[12px] text-slate-400">
            Загрузка цен по выбранным блюдам для городов: ${escapeHtml(cityNames.join(', '))}...
          </td>
        </tr>`;

      setStatus('Загрузка меню по /api/2/menu/by_id (режим: Таблица сверки цен)...', 'info');

      const selectedKeysSet = new Set(selectionItems.keys());
      const combinedMap = new Map();
      const totalReq = selectedPcIds.length || 1;
      let doneReq = 0;

      const orgLabelCache = {};
      orgIds.forEach(id => {
        orgLabelCache[id] = mapOrgsToCityNames([id])[0] || 'Город не указан';
      });

      for (const pcId of selectedPcIds) {
        const payload = {
          externalMenuId: currentMenuId,
          organizationIds: orgIds,
          language: 'ru',
          asyncMode: false,
          startRevision: 0,
          priceCategoryId: pcId
        };
        lastMenuPayload = { endpoint: 'menu/by_id', version: 2, payload: { ...payload } };
        const menuResp = await callBackend('menu/by_id', 2, payload);

        const categories = Array.isArray(menuResp.itemCategories) ? menuResp.itemCategories : [];
        categories.forEach(cat => {
          const catName = cat.name || '';
          const items = Array.isArray(cat.items) ? cat.items : [];
          items.forEach(item => {
            const code = item.sku || item.code || '';
            const name = item.name || '';
            const externalName = item.externalName || item.seoText || item.description || '';
            const sizes = Array.isArray(item.itemSizes) ? item.itemSizes : [];
            const picture = getPictureUrlFromItem(item);

            if (!sizes.length) return;

            sizes.forEach(size => {
              const sizeName = size.sizeName || size.name || '';
              const shortKey = code + '|' + sizeName;
              if (!selectedKeysSet.has(shortKey)) return;

              const prices = Array.isArray(size.prices) ? size.prices : [];
              prices.forEach(p => {
                const orgId = p.organizationId;
                if (!orgId || !selectedOrgIds.has(orgId)) return;

                let val = p.price;
                if (typeof val !== 'number') val = Number(val || 0) || '';

                const cityLabel = orgLabelCache[orgId] || 'Город не указан';
              const key = cityLabel + '||' + code + '||' + sizeName;

              let row = combinedMap.get(key);
              if (!row) {
                const baseSel = selectionItems.get(shortKey);
                row = {
                  key: shortKey,
                  orgId,
                  cityLabel,
                  code,
                  name: baseSel?.name || name,
                  externalName: baseSel?.externalName || externalName,
                    categoryPath: baseSel?.categoryPath || catName,
                    sizeName,
                    prices: {},
                    imageUrl: baseSel?.imageUrl || picture
                  };
                  combinedMap.set(key, row);
                }
                row.prices[pcId] = val;
              });
            });
          });
        });

        doneReq += 1;
        setButtonProgress(loadMenuBtn, 0.1 + 0.8 * (doneReq / totalReq));
      }

      allItems = Array.from(combinedMap.values());
      modeState.selection = {
        loaded: true,
        items: allItems.slice(),
        labels: tableColumnLabels.slice(),
        keys: tableColumnKeys.slice()
      };
      imageVersion++;
      renderTable();
      setStatus(`Загружено позиций: ${allItems.length}`, 'success');

    // ---- orgsAll: города x ЦК ----
    } else if (viewMode === 'orgsAll') {
      const orgIds = Array.from(selectedOrgIds);
      if (!orgIds.length) {
        throw new Error('Выберите минимум один город.');
      }

      const selectedPcIds = selectedPcIdsMultiArr;
      tableColumnKeys = selectedPcIds.slice();
      tableColumnLabels = selectedPcIds.map(pcId => {
        const pc = priceCategories.find(p => p.id === pcId);
        return pc ? (pc.name || pc.id) : pcId;
      });
      filterPerPc = {};
      tableColumnKeys.forEach(k => filterPerPc[k] = false);
      filterAnyPrice = false;
      buildTableHeader();

      const baseCount = getBaseColumnCount();
      const cityNames = mapOrgsToCityNames(orgIds);
      menuTbodyEl.innerHTML = `
        <tr>
          <td colspan="${baseCount + tableColumnLabels.length}" class="px-3 py-3 text-center text-[12px] text-slate-400">
            Загрузка меню и выбранных ЦК для городов: ${escapeHtml(cityNames.join(', '))}...
          </td>
        </tr>`;

      setStatus('Загрузка меню по /api/2/menu/by_id (режим: Цены по городам (все ЦК))...', 'info');

      const combinedMap = new Map();
      const totalReq = selectedPcIds.length || 1;
      let doneReq = 0;

      for (const pcId of selectedPcIds) {
        const payload = {
          externalMenuId: currentMenuId,
          organizationIds: orgIds,
          language: 'ru',
          asyncMode: false,
          startRevision: 0,
          priceCategoryId: pcId
        };
        lastMenuPayload = { endpoint: 'menu/by_id', version: 2, payload: { ...payload } };
        const menuResp = await callBackend('menu/by_id', 2, payload);

        const categories = Array.isArray(menuResp.itemCategories) ? menuResp.itemCategories : [];
        categories.forEach(cat => {
          const catName = cat.name || '';
          const items = Array.isArray(cat.items) ? cat.items : [];
          items.forEach(item => {
            const code = item.sku || item.code || '';
            const name = item.name || '';
            const externalName = item.externalName || item.seoText || item.description || '';
            const sizes = Array.isArray(item.itemSizes) ? item.itemSizes : [];
            const picture = getPictureUrlFromItem(item);

            if (!sizes.length) return;

            sizes.forEach(size => {
              const sizeName = size.sizeName || size.name || '';
              const prices = Array.isArray(size.prices) ? size.prices : [];
              prices.forEach(p => {
                const orgId = p.organizationId;
                if (!orgId || !selectedOrgIds.has(orgId)) return;

                let val = p.price;
                if (typeof val !== 'number') val = Number(val || 0) || '';

                const cityLabel = mapOrgsToCityNames([orgId])[0] || 'Город не указан';
                const key = orgId + '||' + code + '||' + sizeName;
                let row = combinedMap.get(key);
                if (!row) {
                  row = {
                    orgId,
                    cityLabel,
                    code,
                    name,
                    externalName,
                    categoryPath: catName,
                    sizeName,
                    prices: {},
                    imageUrl: picture
                  };
                  combinedMap.set(key, row);
                }
                row.prices[pcId] = val;
              });
            });
          });
        });

        doneReq += 1;
        setButtonProgress(loadMenuBtn, 0.1 + 0.8 * (doneReq / totalReq));
      }

      allItems = Array.from(combinedMap.values());
      modeState.orgsAll = {
        loaded: true,
        items: allItems.slice(),
        labels: tableColumnLabels.slice(),
        keys: tableColumnKeys.slice()
      };
      imageVersion++;
      renderTable();
      setStatus(`Загружено позиций: ${allItems.length}`, 'success');
    }

    loadImagesBtn.disabled = false;
    finishButtonLoading(loadMenuBtn);
  } catch (e) {
    console.error(e);
    setStatus(`Ошибка при загрузке меню: ${e.message}`, 'error');
    finishButtonLoading(loadMenuBtn);
    loadImagesBtn.disabled = false;
  }
});

// === Обновление фото ===
function buildImageMapFromMenu(menuResp) {
  const imageMap = new Map();
  const categories = Array.isArray(menuResp?.itemCategories) ? menuResp.itemCategories : [];
  categories.forEach(cat => {
    const items = Array.isArray(cat.items) ? cat.items : [];
    items.forEach(item => {
      const code = item.sku || item.code || '';
      const sizes = Array.isArray(item.itemSizes) ? item.itemSizes : [];
      const picture = getPictureUrlFromItem(item);

      if (!sizes.length) {
        const key = code + '|';
        if (!imageMap.has(key)) imageMap.set(key, picture);
      } else {
        sizes.forEach(size => {
          const sizeName = size.sizeName || size.name || '';
          const key = code + '|' + sizeName;
          if (!imageMap.has(key)) imageMap.set(key, picture);
        });
      }
    });
  });
  return imageMap;
}

async function updateImagesFromMap(imageMap, { allowClearingMissing = false } = {}) {
  if (!imageMap || imageMap.size === 0) return 0;

  let updated = 0;
  allItems.forEach(row => {
    const key = row.code + '|' + (row.sizeName || '');
    if (imageMap.has(key)) {
      const newUrl = imageMap.get(key) || '';
      if (row.imageUrl !== newUrl) {
        row.imageUrl = newUrl;
        updated++;
      }
    } else if (allowClearingMissing && row.imageUrl) {
      row.imageUrl = '';
      updated++;
    }
  });

  selectionItems.forEach((val, key) => {
    if (imageMap.has(key)) {
      const newUrl = imageMap.get(key) || '';
      if (val.imageUrl !== newUrl) {
        val.imageUrl = newUrl;
      }
    } else if (allowClearingMissing && val.imageUrl) {
      val.imageUrl = '';
    }
  });

  if (imageModalState.list.length) {
    imageModalState.list = imageModalState.list.map(entry => {
      const k = entry.key;
      if (k && imageMap.has(k)) {
        const latest = imageMap.get(k) || '';
        if (entry.rawUrl !== latest) {
          const url = latest ? `/img?url=${encodeURIComponent(latest)}${imageVersion ? '&v=' + imageVersion : ''}` : '';
          return { ...entry, rawUrl: latest, url };
        }
      } else if (allowClearingMissing && entry.rawUrl) {
        return { ...entry, rawUrl: '', url: '' };
      }
      return entry;
    });
  }

  return updated;
}

async function fetchImageMapForCurrentMenu(orgIdForImages) {
  if (!currentMenuId) return { error: 'Сначала загрузите меню' };
  const basePcId = getBasePriceCategoryId();
  const basePayload = {
    externalMenuId: currentMenuId,
    organizationIds: [orgIdForImages],
    includeImages: true,
    priceCategoryId: basePcId || null
  };

  const attempts = [
    { ...basePayload, language: 'ru', asyncMode: false },
    { ...basePayload, language: 'ru', asyncMode: false, startRevision: 0 }
  ];

  let lastError = null;

  for (const payload of attempts) {
    try {
      const menuResp = await callBackend('menu/by_id', 2, payload);
      if (menuResp && menuResp.error) {
        lastError = { error: menuResp.error, details: menuResp.details };
        continue;
      }
      const map = buildImageMapFromMenu(menuResp || {});
      return { map };
    } catch (err) {
      console.error(err);
      lastError = { error: err.message || 'ошибка iiko' };
    }
  }

  if (!lastMenuPayload) {
    return lastError || { error: 'Не удалось получить фото' };
  }

  try {
    const fallbackPayload = {
      ...(lastMenuPayload.payload || {}),
      includeImages: true,
      asyncMode: false,
      priceCategoryId: basePcId || (lastMenuPayload.payload || {}).priceCategoryId || null
    };
    const menuResp = await callBackend(lastMenuPayload.endpoint || 'menu/by_id', lastMenuPayload.version || 2, fallbackPayload);
    if (menuResp && menuResp.error) {
      return { error: menuResp.error, details: menuResp.details };
    }
    const map = buildImageMapFromMenu(menuResp || {});
    return { map };
  } catch (err) {
    console.error(err);
    return { error: err.message || 'Не удалось получить фото' };
  }
}

loadImagesBtn.addEventListener('click', async () => {
  try {
    if (!currentMenuId) {
      setStatus('Сначала выберите меню и загрузите позиции.', 'error');
      return;
    }
    if (!organizations.length) {
      setStatus('Организации ещё не загружены.', 'error');
      return;
    }
    if (!allItems.length) {
      setStatus('Позиции меню ещё не загружены, обновлять фото нечего.', 'error');
      return;
    }

    const orgIdForImages = selectedOrgIds.size
      ? Array.from(selectedOrgIds)[0]
      : organizations[0].id;

    startButtonLoading(loadImagesBtn, 'Обновление фото');
    setButtonProgress(loadImagesBtn, 0.1);
    setStatus('Запрашиваю актуальные фото из iiko...', 'info');
    setImageModalStatus('Обновляю фото...', 'info');

    const { map, error, details } = await fetchImageMapForCurrentMenu(orgIdForImages);
    if (error) {
      finishButtonLoading(loadImagesBtn);
      const detailMsg = details ? ` (${details})` : '';
      setStatus(`Ошибка при обновлении фото: ${error}${detailMsg}`, 'error');
      setImageModalStatus(`Ошибка: ${error}${detailMsg}`, 'error');
      return;
    }
    if (!map || map.size === undefined || map.size === 0) {
      finishButtonLoading(loadImagesBtn);
      setStatus('Нет новых фото из iiko, ответ пустой.', 'info');
      setImageModalStatus('Нет новых фото', 'info');
      return;
    }

    const updated = await updateImagesFromMap(map, { allowClearingMissing: false });

    imageVersion++;
    renderTable();
    if (!imageModal.classList.contains('hidden')) {
      renderImageModalState();
    }

    setButtonProgress(loadImagesBtn, 1.0);
    setStatus(
      updated
        ? `Фото обновлены по данным iiko. Изменённых позиций: ${updated}.`
        : 'Фото уже совпадают с данными iiko, изменений нет.',
      'success'
    );
    setImageModalStatus(updated ? 'Фото обновлены' : 'Изменений нет', updated ? 'success' : 'info');
    finishButtonLoading(loadImagesBtn);
  } catch (e) {
    console.error(e);
    setStatus(`Ошибка при обновлении фото: ${e.message}`, 'error');
    setImageModalStatus(`Ошибка: ${e.message}`, 'error');
    finishButtonLoading(loadImagesBtn);
  }
});

// === Подготовка данных для экспорта в Excel с учётом группировки и свёрнутости ===
/**
 * Формирует:
 *  - visibleItems: реальные строки блюд, которые должны уйти в Excel
 *  - rows: последовательность строк (город/категория/блюдо) в текущем состоянии развёрнутости
 *  - columns: описание колонок (для группировки на бэке)
 */
function buildExportLayoutAndData() {
  const colKeys = tableColumnKeys || [];
  const colLabels = tableColumnLabels || [];
  const baseCount = getBaseColumnCount();

  const hasCityGrouping =
    (viewMode === 'orgsAll') ||
    (viewMode === 'selection' && modeState.selection.loaded);

  const excelColumns = [];

  if (hasCityGrouping) {
    excelColumns.push({ field: 'city', title: 'Город' });
  }
  excelColumns.push({ field: 'category',   title: 'Категория' });
  excelColumns.push({ field: 'name',       title: 'Наименование' });
  excelColumns.push({ field: 'size',       title: 'Размер' });
  if (showDescriptionColumn) {
    excelColumns.push({ field: 'description', title: 'Описание' });
  }
  excelColumns.push({ field: 'code', title: 'SKU' });

  const pcSubtitle = (viewMode === 'orgs') ? getCurrentPriceCategoryName() : '';
  colLabels.forEach((label, idx) => {
    const title = pcSubtitle ? `${label}\n${pcSubtitle}` : label;
    excelColumns.push({
      field: `price_${idx}`,
      title,
      priceKey: colKeys[idx]
    });
  });

  const filteredItems = getFilteredItems();
  if (!filteredItems.length || !colLabels.length) {
    return {
      visibleItems: [],
      rows: [],
      columns: excelColumns
    };
  }

  const rows = [];
  const visibleItems = [];

  function makeItemData(item) {
    const pricesByLabel = {};
    colLabels.forEach((label, idx) => {
      const key = colKeys[idx];
      const val = item.prices && item.prices[key];
      pricesByLabel[label] = val == null ? '' : val;
    });

    return {
      view_mode: viewMode,
      city: hasCityGrouping ? (item.cityLabel || '') : '',
      category: item.categoryPath || '',
      name: item.name || '',
      size: item.sizeName || '',
      description: showDescriptionColumn ? (item.externalName || '') : '',
      code: item.code || '',
      image: item.imageUrl || '',
      prices: pricesByLabel
    };
  }

  if (hasCityGrouping) {
    const byCity = new Map();
    const cityOrderMap = buildCityOrderMap();
    const catOrderMap = new Map();
    filteredItems.forEach(item => {
      const cityLabel = item.cityLabel || 'Город не указан';
      if (!byCity.has(cityLabel)) byCity.set(cityLabel, new Map());
      const cat = item.categoryPath || 'Без категории';
      const catMap = byCity.get(cityLabel);
      if (!catMap.has(cat)) catMap.set(cat, []);
      catMap.get(cat).push(item);
      if (!catOrderMap.has(cat)) catOrderMap.set(cat, catOrderMap.size);
    });

    const sortedCities = keysInOrder(byCity);

    sortedCities.forEach(cityLabel => {
      const catMap = byCity.get(cityLabel);
      const cityCollapsed = collapsedCities.has(cityLabel);
      const totalItemsForCity = Array.from(catMap.values()).reduce((acc, arr) => acc + arr.length, 0);

      rows.push({
        type: 'city',
        city: cityLabel,
        collapsed: cityCollapsed,
        subtotal_count: totalItemsForCity
      });

      const sortedCats = keysInOrder(catMap);

      sortedCats.forEach(cat => {
        const items = catMap.get(cat) || [];
        const catKey = cityLabel + '||' + cat;
        const isCollapsed = collapsedCategories.has(catKey);

        rows.push({
          type: 'category',
          city: cityLabel,
          category: cat,
          collapsed: isCollapsed,
          subtotal_count: items.length
        });

        if (cityCollapsed || isCollapsed) return;

        items.forEach(item => {
          const itemData = makeItemData(item);
          const idx = visibleItems.push(itemData) - 1;
          rows.push({
            type: 'item',
            item_index: idx
          });
        });
      });
    });
  } else {
    const grouped = new Map();
    const catOrderMap = new Map();
    filteredItems.forEach(item => {
      const cat = item.categoryPath || 'Без категории';
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat).push(item);
      if (!catOrderMap.has(cat)) catOrderMap.set(cat, catOrderMap.size);
    });

    const sortedCats = keysInOrder(grouped);

    sortedCats.forEach(cat => {
      const items = grouped.get(cat) || [];
      const isCollapsed = collapsedCategories.has(cat);

      rows.push({
        type: 'category',
        city: '',
        category: cat,
        collapsed: isCollapsed,
        subtotal_count: items.length
      });

      if (isCollapsed) return;

      items.forEach(item => {
        const itemData = makeItemData(item);
        const idx = visibleItems.push(itemData) - 1;
        rows.push({
          type: 'item',
          item_index: idx
        });
      });
    });
  }

  return {
    visibleItems,
    rows,
    columns: excelColumns
  };
}

// === Экспорт в Excel ===
exportBtn.addEventListener('click', async () => {
  try {
    const layout = buildExportLayoutAndData();
    const table_data = layout.visibleItems;

    if (!table_data.length) {
      setStatus('Нет данных для экспорта в текущем виде таблицы.', 'error');
      return;
    }

    startButtonLoading(exportBtn, 'Экспорт');
    setButtonProgress(exportBtn, 0.0);
    setStatus('Формирование Excel...', 'info');

    const res = await fetch('/api/export_excel', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        table_data,
        view_mode: viewMode,
        has_description: showDescriptionColumn,
        layout: {
          rows: layout.rows,
          columns: layout.columns
        },
        filters: {
          category: filterCategoryInput?.value || '',
          name:     filterNameInput?.value || '',
          sku:      filterCodeInput?.value || '',
          any_price: filterAnyPrice,
          per_pc:   filterPerPc
        }
      })
    });
    const json = await res.json();
    if (!res.ok || !json.download_url) {
      throw new Error(json.error || `Ошибка экспорта (${res.status})`);
    }
    setButtonProgress(exportBtn, 1.0);
    setStatus('Excel сформирован, начинается загрузка файла...', 'success');
    window.location.href = json.download_url;
    finishButtonLoading(exportBtn);
  } catch (e) {
    console.error(e);
    setStatus(`Ошибка экспорта: ${e.message}`, 'error');
    finishButtonLoading(exportBtn);
  }
});

// === init ===
async function init() {
  let savedApiKey = null;
  if (!isFreshIndexSession) {
    try {
      savedApiKey = localStorage.getItem('iikoApiLogin');
    } catch (e) {
      console.warn('localStorage unavailable', e);
    }
  }
  if (restoredSession) {
    if (Array.isArray(restoredSession.selectedOrgIds)) {
      selectedOrgIds = new Set(restoredSession.selectedOrgIds);
    }
    if (Array.isArray(restoredSession.selectedPcIdsMulti)) {
      selectedPcIdsMulti = new Set(restoredSession.selectedPcIdsMulti);
    }
    if (restoredSession.currentPriceCategoryId) currentPriceCategoryId = restoredSession.currentPriceCategoryId;
    if (typeof restoredSession.showDescriptionColumn === 'boolean') {
      showDescriptionColumn = restoredSession.showDescriptionColumn;
    }
    if (restoredSession.currentFontSize) currentFontSize = restoredSession.currentFontSize;
    if (restoredSession.viewMode) viewMode = restoredSession.viewMode;
  }

  bindHorizontalScroll(tableScrollContainer);
  bindHorizontalScroll(tableActionBar);
  bindPointerPan(tableScrollContainer);
  if (mobileSelectAllRowsBtn) mobileSelectAllRowsBtn.addEventListener('click', selectAllVisibleRows);
  if (mobileClearRowSelectionBtn) mobileClearRowSelectionBtn.addEventListener('click', clearAllRowSelections);
  window.addEventListener('resize', () => {
    syncCityColumnVisibility();
    syncTableHeaderOffset();
  }, { passive: true });
  window.addEventListener('scroll', () => {
    syncTableHeaderOffset();
  }, { passive: true });
  syncCityColumnVisibility();
  syncTableHeaderOffset();

  if (menuSelectEl) {
    menuSelectEl.addEventListener('change', handleMenuChange);
  }

  if (tableScrollContainer) {
    tableScrollContainer.addEventListener('scroll', () => {
      syncTableHeaderOffset();
    }, { passive: true });
  }

  viewMode = 'orgsAll';
  updateModeButtons();
  applyFontSize();
  toggleDescriptionBtn.textContent = 'Описание +';

  let restored = false;
  if (restoredSession) {
    restored = restoreFromCacheSnapshot(restoredSession);
    if (restored) {
      setStatus('Данные восстановлены из кеша. При необходимости нажмите «Подключить iiko API» для обновления.', 'success');
      setApiStatus(!!savedApiKey);
      if (savedApiKey && apiKeyInput) apiKeyInput.value = savedApiKey;
      renderOrganizations();
      renderMenus(restoredSession.currentMenuId || null);
      renderPriceCategoriesSingle();
      renderPcSingle();
      renderPcMulti();
      updateModeButtons();
      buildTableHeader();
      renderTable();
      updateCitySelectionView(false);
      syncImageButtonAvailability();
    }
  }

  if (!restored) {
    setApiStatus(false);
    if (savedApiKey && apiKeyInput) apiKeyInput.value = savedApiKey;
    setStatus(savedApiKey ? 'Введите apiLogin и нажмите «Подключить iiko API».' : 'Введите apiLogin и нажмите «Подключить iiko API».', 'info');
  }

  window.openImageModalFromUrl = openImageModalFromUrl;
  syncImageButtonAvailability();
}

bootstrapUserKey().then(init);
