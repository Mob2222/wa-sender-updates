// background.js — Service worker: автообновление расширения
//
// ======================= НАСТРОЙКА ========================
// URL version.json для проверки обновлений
const UPDATE_URL = 'https://raw.githubusercontent.com/Mob2222/whatsapp-sender/main/version.json';
const CHECK_INTERVAL = 360; // минут (6 часов)
// ==========================================================

function cmpVer(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0, y = pb[i] || 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

async function checkForUpdate() {
  try {
    const res = await fetch(UPDATE_URL + '?t=' + Date.now());
    if (!res.ok) return;
    const data = await res.json();
    const current = chrome.runtime.getManifest().version;

    if (cmpVer(data.version, current) > 0) {
      await chrome.storage.local.set({
        updateAvailable: {
          version: data.version,
          url: data.download_url,
          notes: data.notes || ''
        }
      });
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#C9A84C' });
    } else {
      await chrome.storage.local.remove('updateAvailable');
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (e) {
    console.log('[WA Sender] Update check failed:', e.message);
  }
}

// Периодическая проверка
chrome.alarms.create('updateCheck', { periodInMinutes: CHECK_INTERVAL });
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'updateCheck') checkForUpdate();
});

// Проверка при установке / обновлении
chrome.runtime.onInstalled.addListener(() => checkForUpdate());

// Ручная проверка из popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'checkUpdate') {
    checkForUpdate().then(() => sendResponse({ ok: true }));
    return true;
  }
});
