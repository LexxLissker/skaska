import { redirect } from 'next/navigation';

import { CatalogPageContent } from '@/components/catalog/catalog-page-content';
import { getCategories } from '@/lib/api/catalog';
import { categoryHref } from '@/lib/catalog-routes';

/**
 * У каталога нет дублирующей «безымянной» категории на `/`: главная ведёт на
 * первую самостоятельную страницу коллекции, например `/pelmeni`.
 */
export default async function CatalogPage() {
    const categories = await getCategories();
    if (!categories.length) return <CatalogPageContent />;

    redirect(categoryHref(categories[0].slug));
}
