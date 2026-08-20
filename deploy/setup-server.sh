#!/usr/bin/env bash
# Первичная подготовка VPS под «Заморозку».
#
# Запускать один раз от root на чистом Ubuntu 22.04/24.04:
#   ssh root@СЕРВЕР 'bash -s' < deploy/setup-server.sh
#
# Что делает: ставит Docker, заводит непривилегированного пользователя для
# деплоя, закрывает файрвол, готовит каталог приложения.

set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-deploy}"
APP_DIR="/opt/zamorozka"

echo "==> Обновляю пакеты"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq

echo "==> Ставлю Docker"
if ! command -v docker >/dev/null 2>&1; then
    apt-get install -y -qq ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg |
        gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
        >/etc/apt/sources.list.d/docker.list

    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker

echo "==> Завожу пользователя $DEPLOY_USER"
# Деплой не должен ходить под root: скомпрометированный ключ не должен
# давать полный контроль над машиной.
if ! id -u "$DEPLOY_USER" >/dev/null 2>&1; then
    adduser --disabled-password --gecos '' "$DEPLOY_USER"
fi
usermod -aG docker "$DEPLOY_USER"

install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
if [[ -f /root/.ssh/authorized_keys ]]; then
    cp /root/.ssh/authorized_keys "/home/$DEPLOY_USER/.ssh/authorized_keys"
    chown "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh/authorized_keys"
    chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"
fi

echo "==> Готовлю каталог приложения"
install -d -m 755 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_DIR"
install -d -m 755 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_DIR/backups"
install -d -m 755 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_DIR/deploy"

echo "==> Настраиваю файрвол"
apt-get install -y -qq ufw
ufw --force reset >/dev/null
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> Ужесточаю SSH"
# Вход по паролю отключаем: ключи уже настроены, а перебор паролей —
# основной способ, которым такие серверы и уводят.
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
systemctl reload ssh || systemctl reload sshd

echo "==> Ставлю автоматические обновления безопасности"
apt-get install -y -qq unattended-upgrades
dpkg-reconfigure -f noninteractive unattended-upgrades

cat <<INFO

Готово.

Дальше:
  1. Направьте A-запись домена на IP этого сервера.
  2. Создайте на сервере $APP_DIR/.env — образец в deploy/env.prod.example.
     Пароли сгенерируйте: openssl rand -base64 32
  3. Склонируйте репозиторий:
       git clone git@github.com:LexxLissker/zamorozka.git $APP_DIR
  4. С ноутбука: DEPLOY_HOST=$DEPLOY_USER@СЕРВЕР ./deploy.sh

INFO
