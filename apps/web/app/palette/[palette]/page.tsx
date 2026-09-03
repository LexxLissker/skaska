import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CatalogPageContent } from '@/components/catalog/catalog-page-content';
import { PaletteSwitcher, type PaletteKey } from '@/components/theme/palette-switcher';

const palettes = new Set<PaletteKey>(['ink', 'graphite', 'espresso']);

export const metadata: Metadata = {
    title: 'Сравнение палитр — Скаска',
    robots: { index: false, follow: false },
};

export default async function PalettePage({
    params,
}: {
    params: Promise<{ palette: string }>;
}) {
    const { palette } = await params;
    if (!palettes.has(palette as PaletteKey)) notFound();

    return (
        <>
            <CatalogPageContent />
            <PaletteSwitcher active={palette as PaletteKey} />
        </>
    );
}
