# 📤 Чек-лист файлов для GitHub

**Легенда:**
- **G** — загружаем в GitHub
- **✗** — НЕ загружаем (секретное / автогенерация)

---

## 📁 Корень репозитория

| Метка | Файл | Комментарий |
|:---:|---|---|
| **G** | `README.md` | главная страница репозитория |
| **G** | `LICENSE` | MIT-лицензия |
| **G** | `.gitignore` | правила игнора |
| **G** | `CHROME_STORE_GUIDE.md` | руководство публикации |
| **G** | `PRIVACY.md` | политика конфиденциальности (MD) |
| **G** | `privacy.html` | политика для GitHub Pages |
| **G** | `version.json` | манифест авто-обновления |
| **G** | `updates.xml` | gupdate для корпоративного install.bat |
| **G** | `publish.sh` | скрипт релиза |
| **G** | `install.bat` | корпоративная установка Windows |
| **G** | `uninstall.bat` | корпоративная деинсталляция |
| **G** | `_FILES_TO_UPLOAD.md` | этот файл-чеклист |
| **✗** | `whatsapp-sender.pem` | **СЕКРЕТНЫЙ КЛЮЧ** — только локально! |
| **✗** | `whatsapp-sender.crx` | бинарник, идёт в GitHub Releases, не в исходники |
| **✗** | `.git/` | внутренности git |
| **✗** | `.claude/` | рабочие файлы Claude Code |

## 📁 whatsapp-sender/ (код расширения)

| Метка | Файл | Комментарий |
|:---:|---|---|
| **G** | `whatsapp-sender/manifest.json` | манифест MV3 |
| **G** | `whatsapp-sender/background.js` | service worker |
| **G** | `whatsapp-sender/content.js` | мост popup ↔ inject |
| **G** | `whatsapp-sender/inject.js` | WPP API-слой |
| **G** | `whatsapp-sender/popup.html` | UI |
| **G** | `whatsapp-sender/popup.js` | логика UI |
| **G** | `whatsapp-sender/rules.json` | правила declarativeNetRequest |
| **G** | `whatsapp-sender/icons/icon16.png` | ⚠️ создать вручную (16×16 PNG) |
| **G** | `whatsapp-sender/icons/icon48.png` | ⚠️ создать вручную (48×48 PNG) |
| **G** | `whatsapp-sender/icons/icon128.png` | ⚠️ создать вручную (128×128 PNG) |
| **✗** | `whatsapp-sender/_metadata/` | автогенерация Chrome при распаковке |

---

## 🔢 Итого

- **G-файлов (загружаем):** 21
- **✗-файлов (не загружаем):** 6

## 🚀 Команда для загрузки всех G-файлов

```bash
cd /c/Users/tsyga/Downloads/whatsapp-sender_1
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/Mob2222/whatsapp-sender.git
git push -u origin main
```

`.gitignore` автоматически исключит всё с меткой ✗ — вы физически не сможете случайно загрузить `.pem` или `.crx`.
