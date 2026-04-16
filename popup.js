const $ = id => document.getElementById(id);
let mediaData = null;
let editingTpl = null; // null = new, string = editing existing name
let editingQueue = null; // same for number queues

// ========== Helpers ==========
function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showToast(text) {
  const t = $('toast');
  t.textContent = text;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; }, 2500);
}

// ========== State persistence ==========
function saveState() {
  chrome.storage.local.set({
    numbers: $('numbers').value,
    message: $('message').value,
    delay: $('delay').value
  });
}
['numbers', 'message', 'delay'].forEach(id =>
  $(id).addEventListener('input', saveState)
);

chrome.storage.local.get(['numbers', 'message', 'delay', 'mediaData', 'progress'], d => {
  if (d.numbers) $('numbers').value = d.numbers;
  if (d.message) $('message').value = d.message;
  if (d.delay) $('delay').value = d.delay;
  if (d.mediaData) { mediaData = d.mediaData; updateMediaUI(); }
  if (d.progress) renderProgress(d.progress);
});

// ========== Number normalization ==========
function normalizeNumber(raw) {
  let n = raw.replace(/\D/g, '');
  if (n.length === 11 && (n[0] === '7' || n[0] === '8')) n = n.slice(1);
  return n.length === 10 ? '7' + n : n;
}

function parseNumbers(raw) {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const seen = new Set();
  const list = [];
  let dupes = 0;
  for (const line of lines) {
    const [rawNum, name] = line.split(',').map(s => s && s.trim());
    const number = normalizeNumber(rawNum);
    if (seen.has(number)) { dupes++; continue; }
    seen.add(number);
    list.push({ number, name: name || '' });
  }
  return { list, dupes };
}

$('numbers').addEventListener('blur', () => {
  const raw = $('numbers').value.trim();
  if (!raw) return;
  const { list, dupes } = parseNumbers(raw);
  if (dupes > 0) {
    $('numbers').value = list.map(i => i.name ? `${i.number},${i.name}` : i.number).join('\n');
    saveState();
    showToast(`Удалено дублей: ${dupes}`);
  }
});

// ========== Templates storage ==========
function loadTemplates(cb) {
  chrome.storage.local.get({ templates: {} }, d => cb(d.templates));
}
function saveTemplates(tpls, cb) {
  chrome.storage.local.set({ templates: tpls }, cb);
}
function getChecked(cb) {
  chrome.storage.local.get({ checkedTemplates: [] }, d => cb(d.checkedTemplates));
}
function setChecked(names) {
  chrome.storage.local.set({ checkedTemplates: names });
}

// ========== Templates UI ==========
function renderTemplates() {
  loadTemplates(tpls => {
    getChecked(checked => {
      const list = $('templatesList');
      const names = Object.keys(tpls).sort();

      // Clean stale checked references
      const validChecked = checked.filter(n => names.includes(n));
      if (validChecked.length !== checked.length) setChecked(validChecked);

      list.innerHTML = '';

      if (names.length === 0) {
        list.innerHTML = '<div class="templates-empty">Нет шаблонов &mdash; создайте первый</div>';
        updateBadge(0);
        return;
      }

      let count = 0;
      names.forEach(name => {
        const isChecked = validChecked.includes(name);
        if (isChecked) count++;

        const item = document.createElement('div');
        item.className = 'template-item' + (isChecked ? ' checked' : '');

        const preview = tpls[name].replace(/\n/g, ' ').slice(0, 70);

        item.innerHTML = `
          <input type="checkbox" class="tpl-cb" data-name="${escHtml(name)}" ${isChecked ? 'checked' : ''}>
          <div class="tpl-info" data-name="${escHtml(name)}">
            <div class="tpl-name">${escHtml(name)}</div>
            <div class="tpl-preview">${escHtml(preview)}</div>
          </div>
          <div class="tpl-actions">
            <button class="tpl-act-btn edit" data-name="${escHtml(name)}" title="Редактировать">&#9998;</button>
            <button class="tpl-act-btn del" data-name="${escHtml(name)}" title="Удалить">&#10005;</button>
          </div>`;

        // Checkbox toggle
        item.querySelector('.tpl-cb').addEventListener('change', function () {
          toggleChecked(name, this.checked);
        });

        // Edit button
        item.querySelector('.tpl-act-btn.edit').addEventListener('click', e => {
          e.stopPropagation();
          showEditor(name);
        });

        // Delete button
        item.querySelector('.tpl-act-btn.del').addEventListener('click', e => {
          e.stopPropagation();
          deleteTemplate(name);
        });

        list.appendChild(item);
      });

      updateBadge(count);
    });
  });
}

function toggleChecked(name, on) {
  getChecked(checked => {
    if (on && !checked.includes(name)) checked.push(name);
    else if (!on) checked = checked.filter(n => n !== name);
    setChecked(checked);
    renderTemplates();
  });
}

function updateBadge(count) {
  const badge = $('selectedBadge');
  if (count > 0) {
    badge.classList.add('active');
    $('selectedCount').textContent = count;
  } else {
    badge.classList.remove('active');
  }
}

function deleteTemplate(name) {
  if (!confirm(`Удалить шаблон "${name}"?`)) return;
  loadTemplates(tpls => {
    delete tpls[name];
    saveTemplates(tpls, () => {
      getChecked(checked => {
        setChecked(checked.filter(n => n !== name));
        renderTemplates();
      });
    });
  });
}

// ========== Template editor ==========
function showEditor(name) {
  editingTpl = name || null;
  const editor = $('tplEditor');
  if (name) {
    loadTemplates(tpls => {
      $('tplName').value = name;
      $('tplText').value = tpls[name] || '';
    });
  } else {
    $('tplName').value = '';
    $('tplText').value = '';
  }
  editor.classList.add('active');
  $('tplName').focus();
}

function hideEditor() {
  editingTpl = null;
  $('tplEditor').classList.remove('active');
  $('tplName').value = '';
  $('tplText').value = '';
}

$('btnNewTpl').addEventListener('click', () => showEditor(null));
$('tplCancel').addEventListener('click', hideEditor);

$('tplSave').addEventListener('click', () => {
  const name = $('tplName').value.trim();
  const text = $('tplText').value;
  if (!name) { alert('Введите название шаблона'); return; }
  if (!text.trim()) { alert('Текст шаблона пустой'); return; }

  loadTemplates(tpls => {
    // If editing and name changed, remove old entry
    if (editingTpl && editingTpl !== name) {
      delete tpls[editingTpl];
      // Update checked list
      getChecked(checked => {
        const idx = checked.indexOf(editingTpl);
        if (idx !== -1) checked[idx] = name;
        setChecked(checked);
      });
    }
    tpls[name] = text;
    saveTemplates(tpls, () => {
      renderTemplates();
      hideEditor();
      showToast(editingTpl ? 'Шаблон обновлён' : 'Шаблон сохранён');
    });
  });
});

// Initial render
renderTemplates();

// ========== Number queues storage ==========
function loadQueues(cb) {
  chrome.storage.local.get({ queues: {} }, d => cb(d.queues));
}
function saveQueues(queues, cb) {
  chrome.storage.local.set({ queues }, cb);
}
function getCheckedQueues(cb) {
  chrome.storage.local.get({ checkedQueues: [] }, d => cb(d.checkedQueues));
}
function setCheckedQueues(names) {
  chrome.storage.local.set({ checkedQueues: names });
}

// ========== Number queues UI ==========
function countQueueNumbers(text) {
  return (text || '').split('\n').map(l => l.trim()).filter(Boolean).length;
}

function renderQueues() {
  loadQueues(queues => {
    getCheckedQueues(checked => {
      const list = $('queuesList');
      const names = Object.keys(queues).sort();

      const validChecked = checked.filter(n => names.includes(n));
      if (validChecked.length !== checked.length) setCheckedQueues(validChecked);

      list.innerHTML = '';

      if (names.length === 0) {
        list.innerHTML = '<div class="templates-empty">Нет сохранённых очередей</div>';
        updateQueueBadge(0);
        return;
      }

      let count = 0;
      names.forEach(name => {
        const isChecked = validChecked.includes(name);
        if (isChecked) count++;

        const item = document.createElement('div');
        item.className = 'template-item' + (isChecked ? ' checked' : '');

        const total = countQueueNumbers(queues[name]);

        item.innerHTML = `
          <input type="checkbox" class="tpl-cb" data-name="${escHtml(name)}" ${isChecked ? 'checked' : ''}>
          <div class="tpl-info" data-name="${escHtml(name)}">
            <div class="tpl-name">${escHtml(name)}</div>
            <div class="tpl-preview">${total} номер${total % 10 === 1 && total % 100 !== 11 ? '' : (total % 10 >= 2 && total % 10 <= 4 && (total % 100 < 10 || total % 100 >= 20) ? 'а' : 'ов')}</div>
          </div>
          <div class="tpl-actions">
            <button class="tpl-act-btn edit" data-name="${escHtml(name)}" title="Редактировать">&#9998;</button>
            <button class="tpl-act-btn del" data-name="${escHtml(name)}" title="Удалить">&#10005;</button>
          </div>`;

        item.querySelector('.tpl-cb').addEventListener('change', function () {
          toggleCheckedQueue(name, this.checked);
        });
        item.querySelector('.tpl-act-btn.edit').addEventListener('click', e => {
          e.stopPropagation();
          showQueueEditor(name);
        });
        item.querySelector('.tpl-act-btn.del').addEventListener('click', e => {
          e.stopPropagation();
          deleteQueue(name);
        });

        list.appendChild(item);
      });

      updateQueueBadge(count);
    });
  });
}

function toggleCheckedQueue(name, on) {
  getCheckedQueues(checked => {
    if (on && !checked.includes(name)) checked.push(name);
    else if (!on) checked = checked.filter(n => n !== name);
    setCheckedQueues(checked);
    renderQueues();
  });
}

function updateQueueBadge(count) {
  const badge = $('selectedQueueBadge');
  if (count > 0) {
    badge.classList.add('active');
    $('selectedQueueCount').textContent = count;
  } else {
    badge.classList.remove('active');
  }
}

function deleteQueue(name) {
  if (!confirm(`Удалить очередь "${name}"?`)) return;
  loadQueues(queues => {
    delete queues[name];
    saveQueues(queues, () => {
      getCheckedQueues(checked => {
        setCheckedQueues(checked.filter(n => n !== name));
        renderQueues();
      });
    });
  });
}

function showQueueEditor(name) {
  editingQueue = name || null;
  const editor = $('queueEditor');
  if (name) {
    loadQueues(queues => {
      $('queueName').value = name;
      $('queueText').value = queues[name] || '';
    });
  } else {
    $('queueName').value = '';
    $('queueText').value = '';
  }
  editor.classList.add('active');
  $('queueName').focus();
}

function hideQueueEditor() {
  editingQueue = null;
  $('queueEditor').classList.remove('active');
  $('queueName').value = '';
  $('queueText').value = '';
}

$('btnNewQueue').addEventListener('click', () => showQueueEditor(null));
$('queueCancel').addEventListener('click', hideQueueEditor);

$('queueSave').addEventListener('click', () => {
  const name = $('queueName').value.trim();
  const text = $('queueText').value;
  if (!name) { alert('Введите название очереди'); return; }
  if (!text.trim()) { alert('Очередь пустая — добавьте хотя бы один номер'); return; }

  loadQueues(queues => {
    if (editingQueue && editingQueue !== name) {
      delete queues[editingQueue];
      getCheckedQueues(checked => {
        const idx = checked.indexOf(editingQueue);
        if (idx !== -1) checked[idx] = name;
        setCheckedQueues(checked);
      });
    }
    queues[name] = text;
    saveQueues(queues, () => {
      renderQueues();
      hideQueueEditor();
      showToast(editingQueue ? 'Очередь обновлена' : 'Очередь сохранена');
    });
  });
});

renderQueues();

// ========== Media ==========
function updateMediaUI() {
  const drop = $('fileDrop');
  if (mediaData) {
    $('fileDropText').textContent = '';
    $('mediaInfo').textContent = mediaData.name;
    $('clearMedia').style.display = 'inline-block';
    drop.classList.add('has-file');
    drop.querySelector('.file-drop-icon').textContent = '\u2705';
  } else {
    $('fileDropText').textContent = 'Нажмите, чтобы выбрать фото или видео';
    $('mediaInfo').textContent = '';
    $('clearMedia').style.display = 'none';
    drop.classList.remove('has-file');
    drop.querySelector('.file-drop-icon').textContent = '\uD83D\uDCCE';
    $('media').value = '';
  }
}

$('media').onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    mediaData = { name: file.name, type: file.type, dataUrl: reader.result };
    chrome.storage.local.set({ mediaData });
    updateMediaUI();
  };
  reader.readAsDataURL(file);
};

$('clearMedia').onclick = e => {
  e.preventDefault();
  mediaData = null;
  chrome.storage.local.remove('mediaData');
  updateMediaUI();
};

// ========== Progress UI ==========
function renderProgress(p) {
  if (!p || !p.total) return;
  $('stats').classList.add('active');
  $('results').classList.add('active');
  $('progressNum').textContent = p.done;
  $('progressTotal').textContent = p.total;
  $('progressFill').style.width = (p.total ? (p.done / p.total * 100) : 0) + '%';
  $('cSuccess').textContent = p.success;
  $('cError').textContent = p.error;
  $('cPending').textContent = p.total - p.done;

  const list = $('resultsList');
  list.innerHTML = '';
  (p.items || []).slice().reverse().forEach(it => {
    const div = document.createElement('div');
    div.className = 'result-item';
    const ok = it.status === 'ok';
    div.innerHTML = `
      <span class="result-icon ${ok ? 'result-ok' : 'result-err'}">${ok ? '\u2714' : '\u2716'}</span>
      <span class="result-num">${it.number}</span>
      <span class="result-msg">${ok ? 'отправлено' : (it.error || 'ошибка')}</span>`;
    list.appendChild(div);
  });
}

function resetProgress(total) {
  const p = { total, done: 0, success: 0, error: 0, items: [] };
  chrome.storage.local.set({ progress: p });
  renderProgress(p);
}

// ========== Start / Stop ==========
$('start').onclick = async () => {
  const raw = $('numbers').value.trim();
  const delay = parseInt($('delay').value) * 1000;

  // Collect messages: checked templates first, fallback to direct message
  let messages = [];

  const tpls = await new Promise(r => loadTemplates(r));
  const checked = await new Promise(r => getChecked(r));
  const selectedTexts = checked.filter(n => tpls[n]).map(n => tpls[n]);

  if (selectedTexts.length > 0) {
    messages = selectedTexts;
  } else {
    const direct = $('message').value;
    if (direct.trim()) messages = [direct];
  }

  // Merge numbers: direct input + selected queues
  const queues = await new Promise(r => loadQueues(r));
  const checkedQueues = await new Promise(r => getCheckedQueues(r));
  const queueTexts = checkedQueues.filter(n => queues[n]).map(n => queues[n]);
  const mergedRaw = [raw, ...queueTexts].filter(Boolean).join('\n');

  if (!mergedRaw.trim()) { alert('Введите номера получателей или выберите очередь'); return; }
  if (messages.length === 0 && !mediaData) { alert('Выберите шаблоны, напишите сообщение или прикрепите файл'); return; }

  const { list, dupes } = parseNumbers(mergedRaw);
  if (dupes > 0) {
    showToast(`Удалено дублей: ${dupes}`);
  }

  if (list.length === 0) { alert('Нет валидных номеров после очистки'); return; }

  resetProgress(list.length);

  let [tab] = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });
  if (!tab) {
    tab = await chrome.tabs.create({ url: 'https://web.whatsapp.com/', active: true });
    alert('Открыл WhatsApp Web. Войдите и нажмите "Начать" снова.');
    return;
  }
  await chrome.tabs.update(tab.id, { active: true });

  chrome.tabs.sendMessage(tab.id, {
    action: 'startSending',
    list,
    messages,
    delay,
    media: mediaData
  }, resp => {
    if (chrome.runtime.lastError) alert('Ошибка: ' + chrome.runtime.lastError.message);
  });
};

$('stop').onclick = async () => {
  const [tab] = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });
  if (tab) chrome.tabs.sendMessage(tab.id, { action: 'stopSending' });
};

// ========== Update notification ==========
chrome.storage.local.get('updateAvailable', d => {
  if (d.updateAvailable) {
    $('updateBar').classList.add('active');
    $('updateVer').textContent = d.updateAvailable.version;
    $('updateLink').href = d.updateAvailable.url;
  }
});

// ========== Live updates ==========
chrome.runtime.onMessage.addListener(msg => {
  if (msg.action === 'progress') {
    chrome.storage.local.set({ progress: msg.progress });
    renderProgress(msg.progress);
  }
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.progress) renderProgress(changes.progress.newValue);
});
