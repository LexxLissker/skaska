import { CatalogView } from '@/components/catalog/catalog-view';
import { getCategories, getCollectionProducts } from '@/lib/api/catalog';

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
    const products = await getCollectionProducts(firstCategory.slug);

    return (
        <CatalogView
            categories={categories}
            initialCategorySlug={firstCategory.slug}
            initialProducts={products}
        />
    );
}
