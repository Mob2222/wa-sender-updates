#!/bin/bash
# ============================================================
# publish.sh — Сборка и публикация обновления
# Использование: ./publish.sh 2.1
#
# Chrome на устройствах с install.bat обновится автоматически
# (проверка каждые несколько часов, без участия пользователя)
# ============================================================
set -e

VERSION="$1"
if [ -z "$VERSION" ]; then
    echo ""
    echo "Использование: ./publish.sh <версия>"
    echo "Пример:        ./publish.sh 2.1"
    echo ""
    exit 1
fi

EXTENSION_DIR="./whatsapp-sender"
PEM_FILE="./whatsapp-sender.pem"

echo ""
echo "=== Публикация WhatsApp Sender v${VERSION} ==="
echo ""

# 1. Обновить версию в manifest.json
echo "[1/5] manifest.json..."
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION}\"/" "${EXTENSION_DIR}/manifest.json"

# 2. Обновить version.json (для in-app fallback checker)
echo "[2/5] version.json..."
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION}\"/" "version.json"
sed -i "s|/v[0-9][0-9.]*/whatsapp-sender.crx|/v${VERSION}/whatsapp-sender.crx|" "version.json"

# 3. Обновить updates.xml (для Chrome native auto-update)
echo "[3/5] updates.xml..."
sed -i "s/version='[^']*'/version='${VERSION}'/" "updates.xml"
sed -i "s|/v[0-9][0-9.]*/whatsapp-sender.crx|/v${VERSION}/whatsapp-sender.crx|" "updates.xml"

# 4. Упаковать .crx
echo "[4/5] Упаковка .crx..."
CHROME_PATH=""
for path in \
    "/c/Program Files/Google/Chrome/Application/chrome.exe" \
    "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
    "$LOCALAPPDATA/Google/Chrome/Application/chrome.exe"; do
    if [ -f "$path" ]; then
        CHROME_PATH="$path"
        break
    fi
done

PACKED=false
if [ -n "$CHROME_PATH" ]; then
    "$CHROME_PATH" --pack-extension="$(pwd)/${EXTENSION_DIR}" --pack-extension-key="$(pwd)/${PEM_FILE}" 2>/dev/null && PACKED=true || true
fi

# 5. Git commit + push
echo "[5/5] Git..."
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git add version.json updates.xml "${EXTENSION_DIR}/manifest.json"
    git commit -m "Release v${VERSION}" 2>/dev/null || true
    git tag "v${VERSION}" 2>/dev/null || true
    echo "  Коммит создан. Запушьте: git push && git push --tags"
else
    echo "  Не git-репозиторий, пропускаю."
fi

echo ""
echo "=== v${VERSION} подготовлена ==="
echo ""
if [ "$PACKED" = true ]; then
    echo "  whatsapp-sender.crx — упакован"
else
    echo "  [!] Chrome не найден — упакуйте вручную:"
    echo "      chrome://extensions > Упаковка расширений"
fi
echo ""
echo "Далее:"
echo "  1. git push && git push --tags"
echo "  2. Создайте GitHub Release: v${VERSION}"
echo "  3. Прикрепите whatsapp-sender.crx к релизу"
echo ""
echo "Chrome на устройствах обновит расширение автоматически."
echo ""
