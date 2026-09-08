import { notFound } from 'next/navigation';

import { getBundles, getCategories, getCollectionProducts } from '@/lib/api/catalog';
import { findSubcategory, subcategoryHref } from '@/lib/catalog-routes';
import { BUNDLES } from '@/lib/content';
import { absoluteUrl, serializeJsonLd } from '@/lib/seo';
import { CatalogView } from './catalog-view';

/** Общая серверная загрузка самостоятельной страницы категории или подкатегории. */
export async function CatalogPageContent({
    categorySlug,
    subcategoryUrlSegment,
}: {
    categorySlug?: string;
    subcategoryUrlSegment?: string;
} = {}) {
    const categories = await getCategories();

    if (!categories.length) {
        return (
            <div className="px-4 py-12 text-center text-text/55">
                <p>Каталог пока пуст.</p>
                <p className="mt-2 text-[13px]">
                    Запустите наполнение базы: <code>npm run seed --workspace=@zamorozka/api</code>
                </p>
            </div>
        );
    }

    const category = categorySlug
        ? categories.find(item => item.slug === categorySlug)
        : categories[0];

    if (!category) notFound();

    const subcategory = subcategoryUrlSegment
        ? findSubcategory(category, subcategoryUrlSegment)
        : null;

    if (subcategoryUrlSegment && !subcategory) notFound();

    const [products, bundles] = await Promise.all([
        getCollectionProducts(subcategory?.slug ?? category.slug),
        getBundles(BUNDLES.map(bundle => bundle.slug)),
    ]);
    const isCatalogRoot = !categorySlug && !subcategoryUrlSegment;
    const pagePath = isCatalogRoot
        ? '/'
        : subcategory
            ? subcategoryHref(category.slug, subcategory.slug)
            : `/${category.slug}`;
    const pageName = subcategory
        ? `${category.name}: ${subcategory.name}`
        : category.name;
    const structuredData = [
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Скаска',
                    item: absoluteUrl('/'),
                },
                ...(!isCatalogRoot
                    ? [{
                        '@type': 'ListItem',
                        position: 2,
                        name: pageName,
                        item: absoluteUrl(pagePath),
                    }]
                    : []),
            ],
        },
        {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: pageName,
            description: subcategory?.description || category.description,
            url: absoluteUrl(pagePath),
            mainEntity: {
                '@type': 'ItemList',
                numberOfItems: products.length,
                itemListElement: products.map((product, index) => ({
                    '@type': 'ListItem',
                    position: index + 1,
                    name: product.name,
                    url: absoluteUrl(`/product/${product.slug}`),
                })),
            },
        },
    ];

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
            />
            <CatalogView
                categories={categories}
                activeCategorySlug={category.slug}
                activeSubSlug={subcategory?.slug ?? null}
                products={products}
                bundles={bundles}
            />
        </>
    );
}
