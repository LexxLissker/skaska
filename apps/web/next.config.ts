import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // Локальный предпросмотр открывается по 127.0.0.1. В dev-режиме Next
    // проверяет Origin и без этого адреса блокирует HMR и клиентские ресурсы.
    allowedDevOrigins: ['127.0.0.1'],
    // standalone кладёт в .next/standalone минимальный сервер со своими
    // зависимостями — в образ не нужно тащить весь node_modules монорепозитория.
    output: 'standalone',
    // Корень монорепозитория: без этого Next не соберёт standalone правильно,
    // потому что зависимости лежат в общем node_modules на уровень выше.
    outputFileTracingRoot: __dirname + '/../..',
};

export default nextConfig;
