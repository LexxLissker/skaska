import type { MetadataRoute } from 'next';

import { getCategories, getCollectionProducts } from '@/lib/api/catalog';
import { categoryHref, subcategoryHref } from '@/lib/catalog-routes';
import { absoluteUrl } from '@/lib/seo';

// Во время Docker-сборки Vendure ещё недоступен. Генерируем sitemap по запросу,
// иначе Next навсегда зафиксирует демонстрационные slug из build-time fallback.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const categories = await getCategories();
    const productGroups = await Promise.all(
        categories.map(category => getCollectionProducts(category.slug)),
    );
    const products = new Map(
        productGroups.flat().map(product => [product.slug, product] as const),
    );

    const categoryPages: MetadataRoute.Sitemap = categories.flatMap(category => [
        {
            url: absoluteUrl(categoryHref(category.slug)),
            changeFrequency: 'weekly' as const,
            priority: 0.9,
            images: category.assetUrl ? [category.assetUrl] : undefined,
        },
        ...category.children.map(subcategory => ({
            url: absoluteUrl(subcategoryHref(category.slug, subcategory.slug)),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
            images: (subcategory.assetUrl || category.assetUrl)
                ? [subcategory.assetUrl || category.assetUrl!]
                : undefined,
        })),
    ],
    );
    const productPages: MetadataRoute.Sitemap = [...products.values()].map(product => ({
        url: absoluteUrl(`/product/${product.slug}`),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
        images: product.assetUrl ? [product.assetUrl] : undefined,
    }));

    return [...categoryPages, ...productPages];
}
