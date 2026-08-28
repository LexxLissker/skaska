import type { NextConfig } from 'next';

const localDevOrigins = (process.env.NEXT_ALLOWED_DEV_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const nextConfig: NextConfig = {
    // В dev-режиме Next проверяет Origin и без этого блокирует HMR и клиентские
    // ресурсы. Дополнительные LAN-адреса задаются локально через запятую.
    allowedDevOrigins: ['127.0.0.1', ...localDevOrigins],
    // standalone кладёт в .next/standalone минимальный сервер со своими
    // зависимостями — в образ не нужно тащить весь node_modules монорепозитория.
    output: 'standalone',
    // Корень монорепозитория: без этого Next не соберёт standalone правильно,
    // потому что зависимости лежат в общем node_modules на уровень выше.
    outputFileTracingRoot: __dirname + '/../..',
};

export default nextConfig;
