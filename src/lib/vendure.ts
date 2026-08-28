import { categories, products, type Category, type Product } from "./storefront-data";

/**
 * The UI deliberately consumes this small catalog contract rather than Vendure
 * GraphQL types directly. It keeps the visual layer independent from the API
 * and makes the mock-to-production switch safe and contained.
 */
export type StorefrontCatalog = {
  categories: Category[];
  products: Product[];
};

export async function getCatalog(): Promise<StorefrontCatalog> {
  const endpoint = process.env.NEXT_PUBLIC_VENDURE_API_URL;

  if (!endpoint) {
    return { categories, products };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: `query StorefrontCatalog {
          collections(options: { take: 50 }) { items { id slug name description featuredAsset { preview source } } }
          products(options: { take: 100 }) {
            items {
              id name description featuredAsset { preview source }
              collections { slug }
              variants { id name priceWithTax currencyCode stockLevel }
            }
          }
        }`,
      }),
      next: { revalidate: 60 },
    });
    const payload = await response.json();
    if (!response.ok || payload.errors) throw new Error("Vendure catalog request failed");

    const apiCategories: Category[] = payload.data.collections.items
      .filter((item: { slug: string }) => item.slug !== "root")
      .map((item: { slug: string; name: string; description?: string }) => ({
        id: item.slug,
        name: item.name,
        description: item.description || "",
        subcategories: [],
      }));
    const apiProducts: Product[] = payload.data.products.items.flatMap(
      (item: { id: string; name: string; description?: string; featuredAsset?: { preview?: string }; collections: { slug: string }[]; variants: { id: string; priceWithTax: number; stockLevel: string }[] }) =>
        item.variants.map((variant) => ({
          id: item.id,
          variantId: variant.id,
          categoryId: item.collections[0]?.slug || "pelmeni",
          name: item.name,
          description: item.description || "",
          price: variant.priceWithTax,
          imageUrl: item.featuredAsset?.preview,
          available: variant.stockLevel !== "OUT_OF_STOCK",
        })),
    );
    return { categories: apiCategories.length ? apiCategories : categories, products: apiProducts.length ? apiProducts : products };
  } catch {
    // The storefront stays usable during first setup, before the Vendure API is online.
    return { categories, products };
  }
}
