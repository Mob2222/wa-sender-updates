// inject.js — выполняется в контексте СТРАНИЦЫ WhatsApp Web
// CSP снят через declarativeNetRequest → загрузка с CDN работает

(async function() {
  if (window.__waSenderReady) return;

  // ===== 1. Загрузить wa-js с CDN =====
  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = url;
      s.onload = () => resolve();
      s.onerror = (e) => reject(new Error('Script load failed: ' + url));
      (document.head || document.documentElement).appendChild(s);
    });
  }

  try {
    if (!window.WPP) {
      console.log('[WA Sender] Загружаю wa-js...');
      await loadScript('https://cdn.jsdelivr.net/npm/@wppconnect/wa-js@3.23.3/dist/wppconnect-wa.js');
      console.log('[WA Sender] wa-js загружен');
    }
  } catch(e) {
    console.error('[WA Sender] Ошибка загрузки wa-js:', e);
    window.dispatchEvent(new CustomEvent('wa-sender-result', {
      detail: { id: 'init', ok: false, error: 'Не удалось загрузить wa-js: ' + e.message }
    }));
    return;
  }

  // ===== 2. Дождаться WPP =====
  if (!window.WPP) {
    console.error('[WA Sender] WPP не определён после загрузки');
    window.dispatchEvent(new CustomEvent('wa-sender-result', {
      detail: { id: 'init', ok: false, error: 'wa-js загружен, но WPP не определён (возможно, CSP не снят или несовместимая версия WhatsApp Web)' }
    }));
    return;
  }

  try {
    if (!WPP.isReady) {
      console.log('[WA Sender] Жду WPP.webpack.onReady...');
      await new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('WPP.webpack.onReady таймаут (25с)')), 25000);
        WPP.webpack.onReady(() => { clearTimeout(t); resolve(); });
      });
    }
  } catch(e) {
    console.error('[WA Sender] Ошибка готовности WPP:', e);
    window.dispatchEvent(new CustomEvent('wa-sender-result', {
      detail: { id: 'init', ok: false, error: e.message }
    }));
    return;
  }

  window.__waSenderReady = true;
  console.log('[WA Sender] WPP готов');

  // ===== 3. Helpers =====
  function dataUrlToBlob(dataUrl) {
    const [header, base64] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)[1];
    const bin = atob(base64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  function toChatId(number) {
    return number + '@c.us';
  }

  // ===== 4. Отправка =====
  async function sendOne(number, text, media) {
    const chatId = toChatId(number);

    // Проверить номер
    const exists = await WPP.contact.queryExists(chatId);
    if (!exists) throw new Error('Номер не в WhatsApp');

    // Текст
    if (text) {
      await WPP.chat.sendTextMessage(chatId, text);
    }

    // Медиа
    if (media && media.dataUrl) {
      const blob = dataUrlToBlob(media.dataUrl);
      const isVideo = (media.type || '').startsWith('video');
      await WPP.chat.sendFileMessage(chatId, blob, {
        type: isVideo ? 'video' : 'image',
        filename: media.name || 'file',
        caption: ''
      });
    }

    // Архивировать
    try {
      await WPP.chat.archive(chatId, true);
    } catch(e) {}
  }

  // ===== 5. Обработка команд =====
  window.addEventListener('wa-sender-command', async (e) => {
    const { id, action, data } = e.detail;

    if (action === 'checkReady') {
      window.dispatchEvent(new CustomEvent('wa-sender-result', {
        detail: { id, ok: true, ready: true }
      }));
      return;
    }

    if (action === 'sendOne') {
      try {
        await sendOne(data.number, data.text, data.media);
        window.dispatchEvent(new CustomEvent('wa-sender-result', {
          detail: { id, ok: true, number: data.number }
        }));
      } catch(err) {
        window.dispatchEvent(new CustomEvent('wa-sender-result', {
          detail: { id, ok: false, number: data.number, error: err.message }
        }));
      }
    }
  });

  // Сигнал готовности
  window.dispatchEvent(new CustomEvent('wa-sender-result', {
    detail: { id: 'init', ok: true, ready: true }
  }));

})();
