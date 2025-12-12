// Lightweight loader for the protected index bundle
const chunkVersion = window.__CHUNK_VERSION__ || Date.now();

async function bootIndex() {
  try {
    const { code } = await import(`/chunks/index.logic.js?v=${chunkVersion}`);
    const buffer = Uint8Array.from(atob(code), (ch) => ch.charCodeAt(0));
    const decoded = new TextDecoder('utf-8').decode(buffer);
    const blobUrl = URL.createObjectURL(new Blob([decoded], { type: 'text/javascript;charset=utf-8' }));
    await import(blobUrl);
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('Не удалось загрузить интерфейс iiko:', err);
    const container = document.getElementById('status') || document.body;
    const banner = document.createElement('div');
    banner.textContent = 'Ошибка загрузки скриптов. Обновите страницу.';
    banner.style.cssText = 'padding:12px 16px;margin:12px;border-radius:12px;background:#fee2e2;color:#991b1b;font-weight:600;';
    container.appendChild(banner);
  }
}

bootIndex();
