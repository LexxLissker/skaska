#!/usr/bin/env bash
# Деплой. Запускать с ноутбука: DEPLOY_HOST=deploy@1.2.3.4 ./deploy.sh
set -euo pipefail
: "${DEPLOY_HOST:?укажи DEPLOY_HOST=пользователь@сервер}"

git push
ssh "$DEPLOY_HOST" 'set -e
  cd /opt/zamorozka
  git pull
  docker compose -f docker-compose.prod.yml up -d --build
  docker image prune -f'
echo "готово"
