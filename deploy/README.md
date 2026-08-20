# Развёртывание на VPS

## Что нужно

- VPS с Ubuntu 22.04 или 24.04, 4 ГБ ОЗУ: сборка образа на сервере съедает ~2 ГБ поверх работающего магазина
- Домен с A-записью на IP сервера
- Репозиторий на GitHub, ключ deploy-пользователя добавлен в него

## Порядок

### 1. Подготовить сервер

```bash
ssh root@СЕРВЕР 'bash -s' < deploy/setup-server.sh
```

Скрипт ставит Docker, заводит пользователя `deploy`, закрывает файрвол
(остаются только 22, 80, 443), отключает вход по паролю и включает
автообновления безопасности.

### 2. Заполнить секреты на сервере

```bash
scp deploy/env.prod.example deploy@СЕРВЕР:/opt/zamorozka/.env
ssh deploy@СЕРВЕР 'chmod 600 /opt/zamorozka/.env && nano /opt/zamorozka/.env'
```

Пароли генерируйте: `openssl rand -base64 32`. Логин администратора
`superadmin/superadmin` в продакшене недопустим — Vendure об этом
предупреждает при каждом старте.

### 3. Первый деплой

С ноутбука:

```bash
ssh deploy@СЕРВЕР 'git clone git@github.com:LexxLissker/zamorozka.git /opt/zamorozka'
DEPLOY_HOST=deploy@СЕРВЕР ./deploy.sh
```

`deploy.sh` пушит в GitHub, забирает изменения на сервере и пересобирает
контейнеры. Отдельный CI не нужен: один сервер, один разработчик —
конвейер и registry тут только добавляют, что обслуживать.

После первого запуска нужно наполнить базу:

```bash
ssh deploy@СЕРВЕР
cd /opt/zamorozka
docker compose -f docker-compose.prod.yml exec api node apps/api/dist/seed/seed.js
```

### 4. Проверить

- `https://ДОМЕН` — витрина
- `https://ДОМЕН/admin` — админка
- `docker compose -f docker-compose.prod.yml ps` — все контейнеры `healthy`

## Обслуживание

**Резервные копии.** Обязательно настройте до приёма первых заказов:

```bash
# в crontab пользователя deploy: ежедневно в 4:00
0 4 * * * cd /opt/zamorozka && docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U vendure zamorozka | gzip > backups/$(date +\%F).sql.gz
```

Копии, лежащие на том же сервере, защищают от испорченных данных, но не от
потери сервера. Настройте выгрузку в S3 или на другую машину.

**Логи:**

```bash
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
```

**Откат:** `git revert` нужного коммита и снова `./deploy.sh`.

## Перед приёмом реальных заказов

- [ ] Заменить заглушку оплаты `mock-sbp` на реальный эквайринг
- [ ] Подключить SMS-шлюз и включить `NEXT_PUBLIC_PHONE_LOGIN_ENABLED`
- [ ] Разместить тексты юридических документов (сейчас ссылки ведут в никуда)
- [ ] Настроить резервное копирование с выгрузкой за пределы сервера
- [ ] Заменить `dev` в EmailPlugin на реальный SMTP
- [ ] Загрузить фотографии товаров
- [ ] Проверить, что `synchronize` схемы выключен (он включается только при `APP_ENV=dev`)
