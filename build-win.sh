#!/usr/bin/env bash
# Сборка Windows .exe из единого HTML-исходника.
#
# Два пути:
#   1) Windows-раннер (проще всего): wine НЕ нужен, достаточно:
#          cd electron && npm ci && npm run dist
#   2) Linux + wine (воспроизводимый рецепт из проекта) — этот скрипт.
#
# Использование:
#   scripts/build-win.sh [путь_к_HTML]
# По умолчанию берётся ../src/full/index.html (линия A, полная версия).
# Для «лёгкой» ветки: scripts/build-win.sh ../src/lite/index.html
#
# Результат: electron/dist/*.exe  (NSIS-инсталлятор + portable, ~76 МБ каждый).
# Примечание: .exe не подписан → у пользователя возможен SmartScreen.

set -euo pipefail

# Корень electron-проекта = каталог, где лежит package.json (electron/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/../electron" && pwd)"
HTML_SRC="${1:-$APP_DIR/../src/full/index.html}"

cd "$APP_DIR"
echo "Electron project: $APP_DIR"
echo "HTML source:      $HTML_SRC"

# --- wine (один раз; требует root/sudo). На Windows-раннере блок пропускается. ---
if [[ "$(uname -s)" == "Linux" ]] && ! command -v wine >/dev/null 2>&1; then
  echo "Устанавливаю wine (нужны права root)…"
  dpkg --add-architecture i386
  apt-get update
  apt-get install -y --no-install-recommends wine64 wine32:i386
  ln -sf /usr/lib/wine/wine   /usr/bin/wine
  ln -sf /usr/lib/wine/wine64 /usr/bin/wine64
fi

# --- зависимости ---
if [[ ! -d node_modules ]]; then
  npm ci || npm install
fi

# --- положить актуальный HTML в бандл ---
mkdir -p app
cp "$HTML_SRC" app/index.html
echo "HTML -> app/index.html"

# --- сборка ---
rm -rf dist
export WINEDEBUG=-all
export CSC_IDENTITY_AUTO_DISCOVERY=false
export WINEPREFIX="${WINEPREFIX:-$HOME/.wine}"

npx electron-builder --win

echo "Готово."
ls -la dist/*.exe || true
