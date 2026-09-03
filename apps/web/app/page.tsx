import { CatalogPageContent } from '@/components/catalog/catalog-page-content';

/**
 * Главная — каталог.
 *
 * Категории и товары стартовой категории приходят с сервера, дальнейшее
 * переключение подгружается на клиенте: так первый экран рендерится сразу,
 * без ожидания гидрации.
 */
export default async function CatalogPage() {
    return <CatalogPageContent />;
}
