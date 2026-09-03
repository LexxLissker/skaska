import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CatalogPageContent } from '@/components/catalog/catalog-page-content';
import { getCategories } from '@/lib/api/catalog';

interface PageProps {
    params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { category: categorySlug } = await params;
    const categories = await getCategories();
    const category = categories.find(item => item.slug === categorySlug);

    if (!category) return {};

    return {
        title: `${category.name} ручной лепки — Скаска`,
        description: category.description,
    };
}

export default async function CategoryPage({ params }: PageProps) {
    const { category: categorySlug } = await params;
    const categories = await getCategories();

    if (!categories.some(item => item.slug === categorySlug)) notFound();

    return <CatalogPageContent categorySlug={categorySlug} />;
}
