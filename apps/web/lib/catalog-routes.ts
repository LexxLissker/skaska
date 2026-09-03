import type { Category, Subcategory } from './api/catalog';

/** Публичный адрес самостоятельной страницы категории. */
export function categoryHref(categorySlug: string): string {
    return `/${categorySlug}`;
}

/**
 * В Vendure дочерние коллекции имеют slug вида `pelmeni-klassika`.
 * В публичном URL повторять категорию не нужно: `/pelmeni/klassika`.
 */
export function subcategorySegment(categorySlug: string, subcategorySlug: string): string {
    const prefix = `${categorySlug}-`;
    return subcategorySlug.startsWith(prefix)
        ? subcategorySlug.slice(prefix.length)
        : subcategorySlug;
}

/** Публичный адрес самостоятельной страницы подкатегории. */
export function subcategoryHref(
    categorySlug: string,
    subcategorySlug: string,
): string {
    return `/${categorySlug}/${subcategorySegment(categorySlug, subcategorySlug)}`;
}

/** Находит дочернюю коллекцию как по короткому URL-сегменту, так и по полному slug. */
export function findSubcategory(
    category: Category,
    segment: string,
): Subcategory | undefined {
    return category.children.find(
        child =>
            child.slug === segment ||
            subcategorySegment(category.slug, child.slug) === segment,
    );
}
