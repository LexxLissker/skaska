import { notFound } from 'next/navigation';

import { ProductView } from '@/components/product/product-view';
import { getConfigurator, getProduct } from '@/lib/api/catalog';

export default async function ProductPage({ params }: PageProps<'/product/[slug]'>) {
    const { slug } = await params;
    const product = await getProduct(slug);

    if (!product) notFound();

    const configurator = await getConfigurator(product.id);

    return <ProductView product={product} configurator={configurator} />;
}
