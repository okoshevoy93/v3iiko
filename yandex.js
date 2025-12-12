// Loader for the protected Yandex bundle
const chunkVersion = window.__CHUNK_VERSION__ || Date.now();

async function bootYandex() {
  try {
    const { code } = await import(`/chunks/yandex.logic.js?v=${chunkVersion}`);
    const binary = atob(code);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
    const blobUrl = URL.createObjectURL(new Blob([buffer], { type: 'text/javascript;charset=utf-8' }));
    await import(blobUrl);
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('Не удалось загрузить интерфейс Yandex:', err);
    const container = document.querySelector('#yandexApp') || document.body;
    const banner = document.createElement('div');
    banner.textContent = 'Ошибка загрузки скриптов. Перезагрузите страницу.';
    banner.style.cssText = 'padding:12px 16px;margin:12px;border-radius:12px;background:#fee2e2;color:#991b1b;font-weight:600;';
    container.appendChild(banner);
  }
}

bootYandex();
