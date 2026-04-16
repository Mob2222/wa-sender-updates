// content.js — мост между popup и inject.js (page context)
// CSP снят → inject.js загружается как обычный скрипт

let stopFlag = false;
let wppReady = false;
let initError = null;

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ========== Inject page script ==========
(function injectPageScript() {
  const s = document.createElement('script');
  s.src = chrome.runtime.getURL('inject.js');
  s.onload = () => s.remove();
  (document.head || document.documentElement).appendChild(s);
})();

// ========== Progress ==========
let progress = null;
function pushProgress() {
  chrome.storage.local.set({ progress });
  chrome.runtime.sendMessage({ action: 'progress', progress }).catch(()=>{});
}
function initProgress(total) {
  progress = { total, done: 0, success: 0, error: 0, items: [] };
  pushProgress();
}
function recordResult(number, status, error) {
  progress.done++;
  if (status === 'ok') progress.success++; else progress.error++;
  progress.items.push({ number, status, error });
  if (progress.items.length > 50) progress.items.shift();
  pushProgress();
}

// ========== Communication with inject.js ==========
let pendingCallbacks = {};
let cmdCounter = 0;

window.addEventListener('wa-sender-result', (e) => {
  const { id } = e.detail;
  if (id === 'init') {
    if (e.detail.ready) {
      wppReady = true;
      initError = null;
      console.log('[WA Sender] WPP ready');
    } else {
      initError = e.detail.error || 'Неизвестная ошибка инициализации';
      console.error('[WA Sender] Init failed:', initError);
    }
  }
  if (pendingCallbacks[id]) {
    pendingCallbacks[id](e.detail);
    delete pendingCallbacks[id];
  }
});

function callInject(action, data, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const id = 'cmd_' + (++cmdCounter);
    const timer = setTimeout(() => {
      delete pendingCallbacks[id];
      reject(new Error('Таймаут'));
    }, timeout);

    pendingCallbacks[id] = (result) => {
      clearTimeout(timer);
      resolve(result);
    };

    window.dispatchEvent(new CustomEvent('wa-sender-command', {
      detail: { id, action, data }
    }));
  });
}

async function waitForReady() {
  for (let i = 0; i < 30; i++) {
    if (wppReady) return true;
    if (initError) {
      throw new Error('Ошибка инициализации: ' + initError);
    }
    try {
      const res = await callInject('checkReady', {}, 2000);
      if (res && res.ready) { wppReady = true; return true; }
    } catch(e) {}
    await sleep(1000);
  }
  if (initError) {
    throw new Error('Ошибка инициализации: ' + initError);
  }
  throw new Error('WPP не готов. Перезагрузите WhatsApp Web (F5) и подождите полной загрузки.');
}

// ========== Messages from popup ==========
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'startSending') {
    stopFlag = false;
    initProgress(msg.list.length);

    (async () => {
      try {
        await waitForReady();
      } catch(e) {
        recordResult('-', 'err', e.message);
        return;
      }

      const messages = msg.messages || (msg.message ? [msg.message] : ['']);

      for (let i = 0; i < msg.list.length; i++) {
        if (stopFlag) break;
        const { number, name } = msg.list[i];
        const template = messages[Math.floor(Math.random() * messages.length)];
        const text = (template || '').replace(/\{name\}/g, name);

        try {
          const res = await callInject('sendOne', {
            number, text, media: msg.media
          }, 60000);

          if (res.ok) recordResult(number, 'ok');
          else recordResult(number, 'err', res.error || 'Ошибка');
        } catch(e) {
          recordResult(number, 'err', e.message);
        }

        if (i < msg.list.length - 1 && !stopFlag) await sleep(msg.delay);
      }
    })();

    sendResponse({ ok: true });
    return true;
  }

  if (msg.action === 'stopSending') {
    stopFlag = true;
    sendResponse({ ok: true });
  }
});
