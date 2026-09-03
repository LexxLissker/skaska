import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CatalogPageContent } from '@/components/catalog/catalog-page-content';
import { getCategories } from '@/lib/api/catalog';
import { findSubcategory } from '@/lib/catalog-routes';

interface PageProps {
    params: Promise<{ category: string; subcategory: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { category: categorySlug, subcategory: subcategorySegment } = await params;
    const categories = await getCategories();
    const category = categories.find(item => item.slug === categorySlug);
    const subcategory = category
        ? findSubcategory(category, subcategorySegment)
        : undefined;

    if (!category || !subcategory) return {};

    return {
        title: `${category.name}, ${subcategory.name} — Скаска`,
        description: subcategory.description,
    };
}

export default async function SubcategoryPage({ params }: PageProps) {
    const { category: categorySlug, subcategory: subcategorySegment } = await params;
    const categories = await getCategories();
    const category = categories.find(item => item.slug === categorySlug);

    if (!category || !findSubcategory(category, subcategorySegment)) notFound();

    return (
        <CatalogPageContent
            categorySlug={categorySlug}
            subcategoryUrlSegment={subcategorySegment}
        />
    );
}
