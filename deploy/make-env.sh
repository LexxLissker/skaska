#!/usr/bin/env bash
# Создаёт /opt/zamorozka/.env со сгенерированными паролями.
# Запуск на сервере: bash deploy/make-env.sh [публичный-адрес]
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$APP_DIR/.env"
PUBLIC_URL="${1:-http://$(hostname -I | awk '{print $1}')}"

if [[ -f "$ENV_FILE" ]]; then
    echo "$ENV_FILE уже существует — не трогаю."
    exit 0
fi

cp "$APP_DIR/deploy/env.prod.example" "$ENV_FILE"

set_var() { sed -i "s|^$1=.*|$1=$2|" "$ENV_FILE"; }

ADMIN_PASS=$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-24)
set_var PUBLIC_URL "$PUBLIC_URL"
set_var DB_PASSWORD "$(openssl rand -hex 24)"
set_var SUPERADMIN_USERNAME admin
set_var SUPERADMIN_PASSWORD "$ADMIN_PASS"
set_var COOKIE_SECRET "$(openssl rand -hex 32)"

chmod 600 "$ENV_FILE"

cat <<INFO

Создан $ENV_FILE

  Адрес магазина:  $PUBLIC_URL
  Админка:         $PUBLIC_URL/admin
  Логин:           admin
  Пароль:          $ADMIN_PASS

Сохраните пароль — больше он нигде не показывается.
INFO
