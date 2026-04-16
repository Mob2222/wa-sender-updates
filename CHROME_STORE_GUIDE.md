# Публикация расширения в Chrome Web Store

Пошаговая инструкция по публикации **WhatsApp Bulk Sender** в магазин Chrome.

---

## ⚠️ Важное предупреждение

Chrome Web Store **запрещает** расширения, которые:
- Автоматизируют отправку сообщений в WhatsApp
- Используют сторонние скрипты с CDN (у нас `wa-js` с jsdelivr)
- Снимают CSP через `declarativeNetRequest`

Google почти гарантированно **отклонит** расширение в текущем виде. Реальные сценарии:
1. **Публикация "Unlisted" (по ссылке)** — шансы выше, но не 100%.
2. **Приватное распространение** (`Private`, только для вашей организации Google Workspace) — самый надёжный путь.
3. **Публичная публикация** — почти наверняка отказ из-за ToS WhatsApp.

Если Chrome Store откажет — используйте уже готовые альтернативы из репозитория:
- **`install.bat`** — корпоративная установка через политику Windows (ExtensionInstallForcelist)
- **`update_url` в manifest.json** + `updates.xml` + подписанный `.crx` — self-hosted авто-обновление без Chrome Store

---

## 1. Регистрация разработчика ($5)

1. Откройте <https://chrome.google.com/webstore/devconsole>
2. Войдите под Google-аккаунтом, с которого будете управлять расширением.
3. Примите соглашение разработчика.
4. Оплатите единоразовый сбор **$5** (нужна банковская карта, не работает Kaspi — только Visa/MC из РК с поддержкой 3-D Secure).
5. Подтвердите email.

---

## 2. Подготовка ZIP-пакета

Chrome Web Store принимает `.zip`, **не `.crx`**. В архиве должна лежать только папка с расширением.

### Что войдёт в архив

```
whatsapp-sender/
├── manifest.json
├── background.js
├── content.js
├── inject.js
├── popup.html
├── popup.js
├── rules.json
└── icons/           ← ОБЯЗАТЕЛЬНО, см. ниже
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Что НЕ должно быть в архиве

- `_metadata/` (автогенерируется Chrome при распаковке локально)
- `*.pem` (секретный ключ!)
- `*.crx`
- `.git/`, `.gitignore`, `README.md`, `CHROME_STORE_GUIDE.md`, `PRIVACY.md`, `publish.sh`, `install.bat`, `uninstall.bat`, `updates.xml`, `version.json`

### Команда упаковки (PowerShell)

```powershell
cd C:\Users\tsyga\Downloads\whatsapp-sender_1
Compress-Archive -Path whatsapp-sender\* -DestinationPath whatsapp-sender.zip -Force
```

Проверьте содержимое:
```powershell
Expand-Archive whatsapp-sender.zip -DestinationPath check\ -Force
dir check
```

---

## 3. Иконки (обязательно)

Chrome Web Store не пропустит расширение без иконок 16×16, 48×48, 128×128.

### Добавьте в `manifest.json`:

```json
{
  "manifest_version": 3,
  "name": "WhatsApp Bulk Sender",
  "version": "2.0",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "action": {
    "default_popup": "popup.html",
    "default_title": "WA Sender",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  ...
}
```

### Где взять иконки

- Сгенерируйте через <https://www.canva.com/> или <https://favicon.io/>
- Или закажите у дизайнера (казахский орнамент + WhatsApp-зелёный)
- Сохраните в `whatsapp-sender/icons/`

---

## 4. Скриншоты и промо-материалы

Google требует **минимум 1 скриншот** в одном из размеров:
- `1280×800` (рекомендуется)
- `640×400`

Подготовьте:
- **1–5 скриншотов** 1280×800 — popup с номерами, шаблонами, прогрессом
- **Маленькая иконка** 128×128 (та же, что в расширении)
- **Промо-картинка** 440×280 (опционально, для главной витрины)
- **Текст описания** (см. шаблон ниже)

### Шаблон описания

**Короткое (132 символа):**
> Массовая рассылка сообщений через WhatsApp Web с шаблонами, очередями номеров и рандомизацией для минимизации блокировок.

**Полное:**
```
WhatsApp Bulk Sender — инструмент для отправки одинаковых или персонализированных
сообщений множеству получателей через официальный интерфейс WhatsApp Web.

Возможности:
• Массовая рассылка списку номеров
• Несколько шаблонов с рандомным выбором для каждого получателя
  (минимизирует риск бана за спам)
• Сохранённые очереди номеров (Клиенты 2024, VIP и др.)
• Подстановка имени {name} в текст
• Вложения: фото, видео
• Настраиваемая задержка между сообщениями
• Автоматическая архивация диалогов после отправки
• Журнал успехов / ошибок

Расширение работает полностью локально — номера и тексты никуда не отправляются
и не попадают на сторонние серверы.

ВАЖНО: используйте ответственно. Массовая рассылка без согласия получателей
нарушает правила WhatsApp и может привести к блокировке вашего аккаунта.
```

---

## 5. Загрузка в Developer Dashboard

1. Откройте <https://chrome.google.com/webstore/devconsole>
2. Нажмите **«New Item»**
3. Перетащите `whatsapp-sender.zip`
4. Дождитесь загрузки (1–2 мин)

### Заполните вкладки

#### Store Listing (обязательно)
- **Название:** WhatsApp Bulk Sender
- **Сводка:** (короткое описание выше)
- **Описание:** (полное описание)
- **Категория:** Productivity
- **Язык:** Russian (Русский)
- **Иконка 128×128:** загрузите
- **Скриншоты:** 1–5 шт. 1280×800
- **Промо-плитка 440×280:** опционально

#### Privacy (обязательно, см. раздел 6)
- Ссылка на политику конфиденциальности (`PRIVACY.md` нужно захостить — проще всего через GitHub Pages)
- Заполнить декларацию о разрешениях (`storage`, `tabs`, `scripting`, `declarativeNetRequest`, `alarms`)
- Подтвердить, что данные не передаются третьим лицам

#### Distribution
- **Visibility:** `Public` / `Unlisted` (по ссылке) / `Private` (для Workspace-организации)
- **Countries:** выберите страны распространения
- **Pricing:** Free

---

## 6. Политика конфиденциальности (КРИТИЧНО)

Google **обязательно** требует публичную URL политики конфиденциальности. Без этого не пустят на ревью.

### Шаги:

1. Файл `PRIVACY.md` (уже создан в корне репо) — перегоните в HTML или оставьте как есть, GitHub умеет рендерить MD.
2. Захостите через GitHub Pages:
   ```
   Repo → Settings → Pages → Source: "main" branch / root → Save
   ```
3. Получите URL вида `https://mob2222.github.io/whatsapp-sender/privacy.html`
4. Вставьте этот URL в Chrome Web Store → Privacy → Privacy policy URL

---

## 7. Декларация разрешений (Permissions justifications)

Google спросит, зачем вам каждое разрешение. Готовые формулировки:

| Permission | Обоснование |
|---|---|
| `storage` | Сохранение пользовательских шаблонов сообщений и очередей номеров локально, а также прогресса рассылки. |
| `tabs` | Поиск открытой вкладки web.whatsapp.com для отправки команд content-скрипту. |
| `scripting` | Не используется активно, оставлено для совместимости. (При ревью можно удалить — рекомендую убрать.) |
| `declarativeNetRequest` | Удаление CSP-заголовков только с `web.whatsapp.com` для подгрузки библиотеки `wa-js` — без неё невозможна отправка сообщений. |
| `alarms` | Периодическая проверка новой версии расширения раз в 6 часов. |
| `host_permissions: https://web.whatsapp.com/*` | Единственный сайт, на котором работает расширение. |

**Remote code:** честно укажите `Yes`, так как `inject.js` загружает `wa-js` с `cdn.jsdelivr.net`. Обоснование:
> Расширение использует библиотеку @wppconnect/wa-js, загружаемую с cdn.jsdelivr.net, для взаимодействия с WhatsApp Web API. Версия библиотеки зафиксирована (@3.23.3), код библиотеки open-source и доступен по адресу https://github.com/wppconnect-team/wa-js.

⚠️ С января 2024 Google ужесточил политику по удалённому коду. Лучше скачать `wa-js` и положить в папку расширения (тогда не нужен CDN и `declarativeNetRequest`). См. раздел 8.

---

## 8. Рекомендуемая доработка для прохождения ревью

Чтобы максимизировать шансы одобрения:

### a) Унести wa-js в локальный файл

```bash
curl -o whatsapp-sender/vendor/wa-js.js https://cdn.jsdelivr.net/npm/@wppconnect/wa-js@3.23.3/dist/wppconnect-wa.js
```

В `inject.js` заменить `loadScript(CDN_URL)` на `loadScript(chrome.runtime.getURL('vendor/wa-js.js'))`.

Добавить `vendor/wa-js.js` в `web_accessible_resources` в `manifest.json`.

Тогда можно **удалить**: `declarativeNetRequest`, `rules.json`, объявление `declarative_net_request` из манифеста. ВНИМАНИЕ: без снятия CSP `wa-js` из `vendor/` всё равно не выполнится на `web.whatsapp.com` — CSP страницы блокирует даже локальные инлайн-скрипты. Поэтому либо оставляем `declarativeNetRequest`, либо пробуем инжект через `chrome.scripting.executeScript` с флагом `world: 'MAIN'` (это работает без снятия CSP).

### b) Использовать executeScript MAIN world (рекомендую)

В `content.js` убрать createElement + src, заменить на:
```javascript
chrome.runtime.sendMessage({ action: 'injectMainWorld' });
```

В `background.js`:
```javascript
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.action === 'injectMainWorld' && sender.tab) {
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      files: ['vendor/wa-js.js', 'inject.js'],
      world: 'MAIN'
    });
  }
});
```

Это убирает необходимость в `declarativeNetRequest` → манифест становится «чище» → ревью проходит легче.

---

## 9. Отправка на ревью

1. После заполнения всех полей нажмите **«Submit for review»**.
2. Срок ревью: **от 1 дня до 3 недель** (первая публикация обычно 3–7 дней).
3. Статусы:
   - `Pending review` — в очереди
   - `In review` — смотрят
   - `Published` — ✅ опубликовано
   - `Rejected` — ❌ пришло письмо с причиной, чините и подавайте заново
4. При отказе — читайте письмо, обычно указывают конкретную политику. Частые причины:
   - Недостаточно обоснованы разрешения → дополните объяснения
   - Remote code → см. раздел 8
   - Спам/автоматизация → самая частая и сложная причина. Попробуйте формулировать расширение как «инструмент для поддержки клиентов», не «массовая рассылка».

---

## 10. Обновления после публикации

Каждый раз, когда хотите выпустить новую версию:

1. В `manifest.json` увеличьте `version` (например `2.0` → `2.1`)
2. Упакуйте zip снова
3. В Developer Dashboard → your item → **Package** → загрузите новый zip
4. **Submit for review** (повторное ревью обычно быстрее, 1–2 дня)

После апрува обновление приедет всем пользователям автоматически в течение 5 часов.

---

## 11. Если Chrome Web Store отказал — план Б

Используйте готовую инфраструктуру из репо:

### Для организации (Windows, Active Directory):
1. Подпишите `.crx` ключом `key.pem` (сохраняйте ключ в безопасности!)
2. Положите `updates.xml` и `.crx` в публичное место (S3, GitHub Releases, ваш сервер)
3. Запустите `install.bat` на машинах сотрудников — прописывает политику `ExtensionInstallForcelist`
4. Chrome сам скачает и установит расширение, без магазина

### Для отдельных пользователей:
1. Включите «Режим разработчика» в `chrome://extensions`
2. «Загрузить распакованное» → выбрать папку `whatsapp-sender`
3. Обновления вручную (git pull + кнопка «Обновить» в `chrome://extensions`)

---

## Чек-лист перед подачей

- [ ] `manifest.json` содержит `icons` и `default_icon`
- [ ] В архиве нет `_metadata/`, `.pem`, `.crx`, `.git/`
- [ ] Иконки 16/48/128 PNG присутствуют
- [ ] 1–5 скриншотов 1280×800
- [ ] Политика конфиденциальности опубликована и URL указан
- [ ] Описание на русском + английском (хотя бы короткое)
- [ ] Обоснование каждого разрешения заполнено
- [ ] Remote code justification заполнен (или удалён CDN)
- [ ] Протестировано на свежем профиле Chrome

Удачи! 🚀
