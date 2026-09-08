import type { Metadata } from 'next';

import { CatalogPageContent } from '@/components/catalog/catalog-page-content';

export const metadata: Metadata = {
    alternates: { canonical: '/' },
    robots: { index: true, follow: true },
};

/** Главная остаётся на чистом домене и открывает первую категорию каталога. */
export default function CatalogPage() {
    return <CatalogPageContent />;
}
