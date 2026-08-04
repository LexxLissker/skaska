import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // standalone кладёт в .next/standalone минимальный сервер со своими
    // зависимостями — в образ не нужно тащить весь node_modules монорепозитория.
    output: 'standalone',
    // Корень монорепозитория: без этого Next не соберёт standalone правильно,
    // потому что зависимости лежат в общем node_modules на уровень выше.
    outputFileTracingRoot: __dirname + '/../..',
};

export default nextConfig;
