import 'server-only';

import { cache } from 'react';

import {
    getCategories,
    getCollectionProducts,
    type Category,
    type ProductCard,
    type Subcategory,
} from './api/catalog';
import { productHref } from './catalog-routes';

export interface ProductRoute {
    product: ProductCard;
    category: Category;
    subcategory: Subcategory;
    href: string;
}

/**
 * Строит единый индекс канонических адресов по реальным коллекциям Vendure.
 * Если товар по ошибке включён в несколько подкатегорий, первой считается
 * коллекция, которая раньше расположена в каталоге.
 */
export const getProductRouteIndex = cache(async (): Promise<Map<string, ProductRoute>> => {
    const categories = await getCategories();
    const collections = await Promise.all(
        categories.flatMap(category =>
            category.children.map(async subcategory => ({
                category,
                subcategory,
                products: await getCollectionProducts(subcategory.slug),
            })),
        ),
    );
    const routes = new Map<string, ProductRoute>();

    for (const { category, subcategory, products } of collections) {
        for (const product of products) {
            if (routes.has(product.slug)) continue;
            routes.set(product.slug, {
                product,
                category,
                subcategory,
                href: productHref(category.slug, subcategory.slug, product.slug),
            });
        }
    }

    return routes;
});

export async function getProductRoute(slug: string): Promise<ProductRoute | null> {
    return (await getProductRouteIndex()).get(slug) ?? null;
}
