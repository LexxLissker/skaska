'use server';

import { shopApi } from '@/lib/vendure';

export interface SearchHit {
    name: string;
    slug: string;
    /** Минимальная цена товара, копейки. */
    price: number;
}

const SEARCH_QUERY = /* GraphQL */ `
    query SearchProducts($term: String!) {
        search(input: { term: $term, groupByProduct: true, take: 8 }) {
            items {
                productName
                slug
                priceWithTax {
                    ... on PriceRange {
                        min
                    }
                    ... on SinglePrice {
                        value
                    }
                }
            }
        }
    }
`;

export async function searchProducts(term: string): Promise<SearchHit[]> {
    const data = await shopApi<{
        search: {
            items: Array<{
                productName: string;
                slug: string;
                priceWithTax: { min?: number; value?: number };
            }>;
        };
    }>(SEARCH_QUERY, { term }, { revalidate: 30 });

    return data.search.items.map(item => ({
        name: item.productName,
        slug: item.slug,
        price: item.priceWithTax.min ?? item.priceWithTax.value ?? 0,
    }));
}
