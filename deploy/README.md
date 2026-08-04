# Развёртывание на VPS

## Что нужно

- VPS с Ubuntu 22.04 или 24.04, минимум 2 ГБ ОЗУ (Vendure + Postgres + Next)
- Домен с A-записью на IP сервера
- Проект в GitLab с включённым Container Registry

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

### 3. Настроить переменные CI

В GitLab: **Settings → CI/CD → Variables**.

| Переменная | Значение | Флаги |
|---|---|---|
| `SSH_PRIVATE_KEY` | приватный ключ доступа к `deploy@СЕРВЕР` | Protected, Masked |
| `DEPLOY_HOST` | IP или домен сервера | Protected |
| `DEPLOY_USER` | `deploy` | Protected |
| `DEPLOY_HOST_KEY` | вывод `ssh-keyscan -H СЕРВЕР` | Protected |
| `DOMAIN` | домен магазина | Protected |

Отпечаток хоста задаётся переменной, а не собирается через `ssh-keyscan`
в момент деплоя: keyscan доверяет тому, что ответит сеть, и от подмены
сервера не защищает.

### 4. Первый деплой

Конвейер собирает образы автоматически при пуше в `main`. Стадия `deploy`
запускается кнопкой — это намеренно, пока деплой не обкатан.

После первого запуска нужно наполнить базу:

```bash
ssh deploy@СЕРВЕР
cd /opt/zamorozka
docker compose -f docker-compose.prod.yml exec api node apps/api/dist/seed/seed.js
```

### 5. Проверить

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

**Откат на предыдущую версию:** образы помечены SHA коммита, поэтому

```bash
REGISTRY_IMAGE_API=registry.gitlab.com/lexxlissker/zamorozka/api:ПРЕДЫДУЩИЙ_SHA \
REGISTRY_IMAGE_WEB=registry.gitlab.com/lexxlissker/zamorozka/web:ПРЕДЫДУЩИЙ_SHA \
docker compose -f docker-compose.prod.yml up -d
```

## Перед приёмом реальных заказов

- [ ] Заменить заглушку оплаты `mock-sbp` на реальный эквайринг
- [ ] Подключить SMS-шлюз и включить `NEXT_PUBLIC_PHONE_LOGIN_ENABLED`
- [ ] Разместить тексты юридических документов (сейчас ссылки ведут в никуда)
- [ ] Настроить резервное копирование с выгрузкой за пределы сервера
- [ ] Заменить `dev` в EmailPlugin на реальный SMTP
- [ ] Загрузить фотографии товаров
- [ ] Проверить, что `synchronize` схемы выключен (он включается только при `APP_ENV=dev`)
