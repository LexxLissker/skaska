import { CatalogView } from '@/components/catalog/catalog-view';
import { getBundles, getCategories, getCollectionProducts } from '@/lib/api/catalog';
import { BUNDLES } from '@/lib/content';

/**
 * Главная — каталог.
 *
 * Категории и товары стартовой категории приходят с сервера, дальнейшее
 * переключение подгружается на клиенте: так первый экран рендерится сразу,
 * без ожидания гидрации.
 */
export default async function CatalogPage() {
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

    const firstCategory = categories[0];
    // В макете сразу открыта первая подкатегория, а не «все товары категории».
    const firstSub = firstCategory.children[0] ?? null;

    const [products, bundles] = await Promise.all([
        getCollectionProducts(firstSub?.slug ?? firstCategory.slug),
        getBundles(BUNDLES.map(b => b.slug)),
    ]);

    return (
        <CatalogView
            categories={categories}
            initialCategorySlug={firstCategory.slug}
            initialSubSlug={firstSub?.slug ?? null}
            initialProducts={products}
            bundles={bundles}
        />
    );
}
