import { shopApi } from '../vendure';

/** Каталог меняется редко — кэшируем на минуту, чтобы не дёргать API на каждый заход. */
const CATALOG_CACHE = { revalidate: 60, tags: ['catalog'] };

export interface Subcategory {
    id: string;
    name: string;
    slug: string;
    description: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string;
    assetUrl: string | null;
    children: Subcategory[];
}

export interface ProductCard {
    id: string;
    name: string;
    slug: string;
    assetUrl: string | null;
    /** Цены по весу, копейки. */
    prices: { '500': number; '1000': number };
    variantIds: { '500': string; '1000': string };
}

export interface OptionChoice {
    id: string;
    label: string;
    delta: number;
    hint: string;
    bju: { protein: number; fat: number; carbs: number; kcal: number };
}

export interface OptionGroup {
    code: string;
    label: string;
    choices: OptionChoice[];
}

export interface Addon {
    id: string;
    name: string;
    price: number;
    productVariantId: string | null;
}

export interface ProductDetail {
    id: string;
    name: string;
    slug: string;
    description: string;
    assetUrl: string | null;
    categoryCode: string | null;
    variants: Array<{ id: string; name: string; price: number; weight: string }>;
}

const CATEGORIES_QUERY = /* GraphQL */ `
    query Categories {
        collections(options: { topLevelOnly: true, take: 50 }) {
            items {
                id
                name
                slug
                description
                featuredAsset {
                    preview
                }
                children {
                    id
                    name
                    slug
                    description
                }
            }
        }
    }
`;

export async function getCategories(): Promise<Category[]> {
    const data = await shopApi<{
        collections: {
            items: Array<{
                id: string;
                name: string;
                slug: string;
                description: string;
                featuredAsset: { preview: string } | null;
                children: Subcategory[];
            }>;
        };
    }>(CATEGORIES_QUERY, {}, CATALOG_CACHE);

    return data.collections.items.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        assetUrl: c.featuredAsset?.preview ?? null,
        children: c.children ?? [],
    }));
}

const PRODUCTS_QUERY = /* GraphQL */ `
    query CollectionProducts($slug: String!) {
        collection(slug: $slug) {
            # 100 — потолок постраничных запросов Vendure. В категории 16 товаров
            # по два веса, так что одной страницы хватает с запасом.
            productVariants(options: { take: 100 }) {
                totalItems
                items {
                    id
                    name
                    priceWithTax
                    sku
                    product {
                        id
                        name
                        slug
                        featuredAsset {
                            preview
                        }
                    }
                }
            }
        }
    }
`;

/**
 * Товары коллекции, свёрнутые по товару: в сетке карточка одна, а вес
 * переключается прямо на ней. Артикул оканчивается на `-500` / `-1000`,
 * по нему и различаем варианты.
 */
export async function getCollectionProducts(slug: string): Promise<ProductCard[]> {
    const data = await shopApi<{
        collection: {
            productVariants: {
                items: Array<{
                    id: string;
                    name: string;
                    priceWithTax: number;
                    sku: string;
                    product: {
                        id: string;
                        name: string;
                        slug: string;
                        featuredAsset: { preview: string } | null;
                    };
                }>;
            };
        } | null;
    }>(PRODUCTS_QUERY, { slug }, CATALOG_CACHE);

    if (!data.collection) return [];

    const byProduct = new Map<string, ProductCard>();

    for (const variant of data.collection.productVariants.items) {
        const p = variant.product;
        let card = byProduct.get(p.id);
        if (!card) {
            card = {
                id: p.id,
                name: p.name,
                slug: p.slug,
                assetUrl: p.featuredAsset?.preview ?? null,
                prices: { '500': 0, '1000': 0 },
                variantIds: { '500': '', '1000': '' },
            };
            byProduct.set(p.id, card);
        }

        const weight = variant.sku.endsWith('-1000') ? '1000' : '500';
        card.prices[weight] = variant.priceWithTax;
        card.variantIds[weight] = variant.id;

        // Дополнения «Гастролавки» — без веса, одна цена на обе позиции.
        if (variant.sku.startsWith('addon-')) {
            card.prices['1000'] = variant.priceWithTax;
            card.variantIds['1000'] = variant.id;
        }
    }

    return [...byProduct.values()];
}

const PRODUCT_QUERY = /* GraphQL */ `
    query ProductDetail($slug: String!) {
        product(slug: $slug) {
            id
            name
            slug
            description
            featuredAsset {
                preview
            }
            customFields {
                categoryCode
            }
            variants {
                id
                name
                priceWithTax
                sku
            }
        }
    }
`;

export async function getProduct(slug: string): Promise<ProductDetail | null> {
    const data = await shopApi<{
        product: {
            id: string;
            name: string;
            slug: string;
            description: string;
            featuredAsset: { preview: string } | null;
            customFields: { categoryCode: string | null } | null;
            variants: Array<{ id: string; name: string; priceWithTax: number; sku: string }>;
        } | null;
    }>(PRODUCT_QUERY, { slug }, CATALOG_CACHE);

    if (!data.product) return null;

    return {
        id: data.product.id,
        name: data.product.name,
        slug: data.product.slug,
        description: data.product.description,
        assetUrl: data.product.featuredAsset?.preview ?? null,
        categoryCode: data.product.customFields?.categoryCode ?? null,
        variants: data.product.variants.map(v => ({
            id: v.id,
            name: v.name,
            price: v.priceWithTax,
            weight: v.sku.endsWith('-1000') ? '1000' : '500',
        })),
    };
}

const CONFIGURATOR_QUERY = /* GraphQL */ `
    query Configurator($productId: ID) {
        productConfigurator(productId: $productId) {
            groups {
                code
                label
                choices {
                    id
                    label
                    delta
                    hint
                    bju {
                        protein
                        fat
                        carbs
                        kcal
                    }
                }
            }
            baseBju {
                protein
                fat
                carbs
                kcal
            }
            addons {
                id
                name
                price
                productVariantId
            }
        }
    }
`;

export interface ConfiguratorData {
    groups: OptionGroup[];
    baseBju: { protein: number; fat: number; carbs: number; kcal: number } | null;
    addons: Addon[];
}

export async function getConfigurator(productId?: string): Promise<ConfiguratorData> {
    const data = await shopApi<{ productConfigurator: ConfiguratorData }>(
        CONFIGURATOR_QUERY,
        { productId: productId ?? null },
        CATALOG_CACHE,
    );
    return data.productConfigurator;
}
