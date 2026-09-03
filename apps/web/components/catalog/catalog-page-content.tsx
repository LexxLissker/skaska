import { notFound } from 'next/navigation';

import { getBundles, getCategories, getCollectionProducts } from '@/lib/api/catalog';
import { findSubcategory } from '@/lib/catalog-routes';
import { BUNDLES } from '@/lib/content';
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

    return (
        <CatalogView
            categories={categories}
            activeCategorySlug={category.slug}
            activeSubSlug={subcategory?.slug ?? null}
            products={products}
            bundles={bundles}
        />
    );
}
