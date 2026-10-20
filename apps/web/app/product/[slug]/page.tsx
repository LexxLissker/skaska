import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';

import { ProductPageContent } from '@/components/product/product-page-content';
import { getProduct } from '@/lib/api/catalog';
import { getProductRoute } from '@/lib/product-routes.server';
import { productMetadata } from '@/lib/seo';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const [product, route] = await Promise.all([
        getProduct(slug),
        getProductRoute(slug),
    ]);

    if (!product) return { robots: { index: false, follow: false } };
    if (route) {
        return {
            alternates: { canonical: route.href },
            robots: { index: false, follow: true },
        };
    }
    return productMetadata(product, `/product/${product.slug}`);
}

export default async function ProductPage({ params }: PageProps) {
    const { slug } = await params;
    const [product, route] = await Promise.all([
        getProduct(slug),
        getProductRoute(slug),
    ]);

    if (!product) notFound();
    if (route) permanentRedirect(route.href);

    // Запасной вариант для товара, который ещё не включён ни в одну
    // подкатегорию: страница остаётся доступной, но в sitemap не продвигается.
    return <ProductPageContent product={product} path={`/product/${product.slug}`} />;
}
