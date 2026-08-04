# Витрина Next.js в режиме standalone.
FROM node:24-bookworm-slim AS base
WORKDIR /app

# ─── Зависимости ──────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --include=dev --workspace=@zamorozka/web --include-workspace-root

# ─── Сборка ───────────────────────────────────────────────────────────────────
FROM deps AS build
COPY apps/web ./apps/web

# Публичные переменные вшиваются в бандл на этапе сборки, а не читаются
# в рантайме, — поэтому их нужно передать сюда через build-args.
ARG NEXT_PUBLIC_SHOP_API_URL
ARG NEXT_PUBLIC_PHONE_LOGIN_ENABLED=false
ENV NEXT_PUBLIC_SHOP_API_URL=$NEXT_PUBLIC_SHOP_API_URL \
    NEXT_PUBLIC_PHONE_LOGIN_ENABLED=$NEXT_PUBLIC_PHONE_LOGIN_ENABLED \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build --workspace=@zamorozka/web

# ─── Разработка ───────────────────────────────────────────────────────────────
FROM deps AS dev
ENV NODE_ENV=development NEXT_TELEMETRY_DISABLED=1
COPY apps/web ./apps/web
EXPOSE 3001
CMD ["npm", "run", "dev", "--workspace=@zamorozka/web"]

# ─── Продакшен ────────────────────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3001 HOSTNAME=0.0.0.0

# standalone уже содержит нужные зависимости — npm ci здесь не нужен.
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public

USER node
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://localhost:3001/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/web/server.js"]
