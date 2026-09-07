import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CatalogPageContent } from '@/components/catalog/catalog-page-content';
import { getCategories } from '@/lib/api/catalog';
import { catalogMetadata } from '@/lib/seo';

interface PageProps {
    params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { category: categorySlug } = await params;
    const categories = await getCategories();
    const category = categories.find(item => item.slug === categorySlug);

    if (!category) return {};

    return catalogMetadata(category);
}

export default async function CategoryPage({ params }: PageProps) {
    const { category: categorySlug } = await params;
    const categories = await getCategories();
    const category = categories.find(item => item.slug === categorySlug);

    if (!category) notFound();

    return <CatalogPageContent categorySlug={categorySlug} />;
}
