# Vendure API. Один образ обслуживает и сервер, и воркер —
# они отличаются только командой запуска.
#
# Взят debian-slim, а не alpine: bcrypt и sharp тянут нативные бинарники,
# и glibc-сборки у них проверены лучше, чем musl.
FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NODE_ENV=production

# ─── Зависимости ──────────────────────────────────────────────────────────────
# Манифесты копируем отдельно от исходников: слой с npm ci переиспользуется,
# пока не изменились зависимости.
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
# --include=dev нужен для сборки (typescript, ts-node).
RUN npm ci --include=dev --workspace=@zamorozka/api --include-workspace-root

# ─── Сборка ───────────────────────────────────────────────────────────────────
FROM deps AS build
COPY apps/api ./apps/api
RUN npm run build --workspace=@zamorozka/api

# ─── Разработка ───────────────────────────────────────────────────────────────
# Цель для docker compose: исходники монтируются томом, работает ts-node.
FROM deps AS dev
ENV NODE_ENV=development
COPY apps/api ./apps/api
EXPOSE 3000 3002
CMD ["npm", "run", "dev:server", "--workspace=@zamorozka/api"]

# ─── Продакшен ────────────────────────────────────────────────────────────────
FROM base AS production

# Ставим только рантайм-зависимости — без typescript и сборочного инструментария.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --omit=dev --workspace=@zamorozka/api --include-workspace-root \
    && npm cache clean --force

COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY apps/api/email-templates ./apps/api/email-templates

# Каталог загруженных файлов должен принадлежать пользователю node,
# иначе загрузка ассетов упадёт по правам.
RUN mkdir -p /app/apps/api/static && chown -R node:node /app/apps/api/static

# AdminUiPlugin при старте перезаписывает vendure-ui-config.json прямо
# в node_modules — под непривилегированным пользователем это падает с EACCES.
# Отдаём ему только этот каталог, остальной node_modules остаётся за root.
RUN chown -R node:node /app/node_modules/@vendure/admin-ui-plugin/lib/admin-ui

USER node
EXPOSE 3000

# Оркестратор должен знать, что процесс не просто жив, а отвечает.
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/api/dist/index.js"]
