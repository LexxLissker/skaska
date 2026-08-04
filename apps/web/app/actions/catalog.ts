'use server';

import { getCollectionProducts, type ProductCard } from '@/lib/api/catalog';

/** Подгрузка товаров при переключении категории или подкатегории. */
export async function loadProducts(collectionSlug: string): Promise<ProductCard[]> {
    return getCollectionProducts(collectionSlug);
}
