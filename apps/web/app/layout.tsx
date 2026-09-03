import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import './globals.css';
import { BottomNav } from '@/components/chrome/bottom-nav';
import { DesktopFooter } from '@/components/chrome/desktop-footer';
import { PaletteShell } from '@/components/theme/palette-shell';
import { getAccountSession } from '@/lib/account';
import { getCategories } from '@/lib/api/catalog';
import { getCart } from '@/lib/api/cart';

export const metadata: Metadata = {
    title: 'Заморозка — пельмени и вареники ручной лепки',
    description:
        'Пельмени, вареники, манты и хинкали ручной лепки. Замораживаем в день лепки, ' +
        'привозим по расписанию в термосумке.',
    manifest: '/manifest.webmanifest',
    appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Заморозка' },
};

export const viewport: Viewport = {
    themeColor: '#090D16',
    width: 'device-width',
    initialScale: 1,
    // Витрина — приложение, а не документ: масштабирование ломает липкие панели.
    maximumScale: 1,
    viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
    const [cart, account, categories] = await Promise.all([
        getCart(),
        getAccountSession(),
        getCategories(),
    ]);

    return (
        <html lang="ru" className="h-full antialiased">
            <body className="min-h-full">
                <PaletteShell>
                    <main className="flex-1 pb-16 lg:pb-0 lg:pt-[72px]">{children}</main>
                    <DesktopFooter />
                    <BottomNav
                        cartQuantity={cart?.totalQuantity ?? 0}
                        accountPhone={account?.phoneDisplay ?? null}
                        catalogSlugs={categories.map(category => category.slug)}
                    />
                </PaletteShell>
            </body>
        </html>
    );
}
