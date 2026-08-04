import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Заморозка — пельмени и вареники ручной лепки',
        short_name: 'Заморозка',
        description:
            'Пельмени, вареники, манты и хинкали ручной лепки с доставкой по расписанию.',
        start_url: '/',
        display: 'standalone',
        background_color: '#090D16',
        theme_color: '#090D16',
        orientation: 'portrait',
        lang: 'ru',
        categories: ['food', 'shopping'],
        icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
    };
}
