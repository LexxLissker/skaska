import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { CatalogPageContent } from '@/components/catalog/catalog-page-content';
import { getCategories } from '@/lib/api/catalog';
import { subcategoryHref } from '@/lib/catalog-routes';
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

    const firstSubcategory = category.children[0];
    if (firstSubcategory) {
        redirect(subcategoryHref(category.slug, firstSubcategory.slug));
    }

    return <CatalogPageContent categorySlug={categorySlug} />;
}
