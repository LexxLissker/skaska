import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ProductView } from '@/components/product/product-view';
import { getConfigurator, getProduct } from '@/lib/api/catalog';
import {
    absoluteUrl,
    plainText,
    productMetadata,
    serializeJsonLd,
    SITE_NAME,
} from '@/lib/seo';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const product = await getProduct(slug);

    if (!product) return { robots: { index: false, follow: false } };
    return productMetadata(product);
}

export default async function ProductPage({ params }: PageProps) {
    const { slug } = await params;
    const product = await getProduct(slug);

    if (!product) notFound();

    const configurator = await getConfigurator(product.id);
    const productUrl = absoluteUrl(`/product/${product.slug}`);
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: plainText(product.name),
        description: plainText(product.description),
        image: product.assetUrl ? [product.assetUrl] : undefined,
        brand: { '@type': 'Brand', name: SITE_NAME },
        offers: product.variants.map(variant => ({
            '@type': 'Offer',
            name: variant.name,
            url: productUrl,
            priceCurrency: 'RUB',
            price: (variant.price / 100).toFixed(2),
            availability: 'https://schema.org/InStock',
            itemCondition: 'https://schema.org/NewCondition',
        })),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
            />
            <ProductView product={product} configurator={configurator} />
        </>
    );
}
