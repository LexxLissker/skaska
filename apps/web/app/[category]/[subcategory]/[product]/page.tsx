import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';

import { ProductPageContent } from '@/components/product/product-page-content';
import { getProduct } from '@/lib/api/catalog';
import {
    categoryHref,
    subcategoryHref,
} from '@/lib/catalog-routes';
import { getProductRoute } from '@/lib/product-routes.server';
import { productMetadata } from '@/lib/seo';

interface PageProps {
    params: Promise<{
        category: string;
        subcategory: string;
        product: string;
    }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { category, subcategory, product: productSlug } = await params;
    const [product, route] = await Promise.all([
        getProduct(productSlug),
        getProductRoute(productSlug),
    ]);

    if (!product || !route) return { robots: { index: false, follow: false } };

    const requestedPath = `/${category}/${subcategory}/${productSlug}`;
    if (requestedPath !== route.href) {
        return {
            alternates: { canonical: route.href },
            robots: { index: false, follow: true },
        };
    }

    return productMetadata(product, route.href);
}

export default async function ProductPage({ params }: PageProps) {
    const { category, subcategory, product: productSlug } = await params;
    const [product, route] = await Promise.all([
        getProduct(productSlug),
        getProductRoute(productSlug),
    ]);

    if (!product || !route) notFound();

    const requestedPath = `/${category}/${subcategory}/${productSlug}`;
    if (requestedPath !== route.href) permanentRedirect(route.href);

    return (
        <ProductPageContent
            product={product}
            path={route.href}
            breadcrumbs={[
                {
                    name: route.category.name,
                    href: categoryHref(route.category.slug),
                },
                {
                    name: route.subcategory.name,
                    href: subcategoryHref(route.category.slug, route.subcategory.slug),
                },
                { name: product.name, href: route.href },
            ]}
        />
    );
}
