import { getConfigurator, type ProductDetail } from '@/lib/api/catalog';
import {
    absoluteUrl,
    plainText,
    serializeJsonLd,
    SITE_NAME,
} from '@/lib/seo';
import { ProductView } from './product-view';

interface Breadcrumb {
    name: string;
    href: string;
}

export async function ProductPageContent({
    product,
    path,
    breadcrumbs = [],
}: {
    product: ProductDetail;
    path: string;
    breadcrumbs?: Breadcrumb[];
}) {
    const configurator = await getConfigurator(product.id);
    const productUrl = absoluteUrl(path);
    const structuredData = [
        {
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
        },
        ...(breadcrumbs.length > 0
            ? [{
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: SITE_NAME, item: absoluteUrl('/') },
                    ...breadcrumbs.map((item, index) => ({
                        '@type': 'ListItem',
                        position: index + 2,
                        name: item.name,
                        item: absoluteUrl(item.href),
                    })),
                ],
            }]
            : []),
    ];

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
