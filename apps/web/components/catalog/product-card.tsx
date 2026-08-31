'use client';

import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { addToCart } from '@/app/actions/cart';
import type { ProductCard as ProductCardType } from '@/lib/api/catalog';
import { flyToCart } from '@/lib/fly-to-cart';
import { formatAmount } from '@/lib/format';
import { ImagePlaceholder } from './image-placeholder';
import { WeightToggle } from './weight-toggle';

/**
 * Карточка каталога: фото, название, переключатель веса и кнопка добавления
 * с ценой. Товар кладётся в корзину прямо из сетки, без захода в карточку —
 * с настройками по умолчанию.
 */
export function ProductCard({ product }: { product: ProductCardType }) {
    const router = useRouter();
    const [weight, setWeight] = useState<'500' | '1000'>('500');
    const [pending, startTransition] = useTransition();
    const buttonRef = useRef<HTMLButtonElement>(null);

    // У дополнений «Гастролавки» веса нет — обе цены совпадают.
    const hasWeights = product.prices['500'] !== product.prices['1000'];
    const price = product.prices[weight] || product.prices['500'];
    const variantId = product.variantIds[weight] || product.variantIds['500'];

    function add() {
        if (!variantId) return;
        flyToCart(buttonRef.current);
        startTransition(async () => {
            await addToCart(variantId, 1);
            router.refresh();
        });
    }

    return (
        <article className="panel flex flex-col overflow-hidden">
            {product.isAddon ? (
                <button type="button" onClick={add} className="block w-full text-left">
                    <ImagePlaceholder
                        src={product.assetUrl}
                        alt={product.name}
                        className="aspect-square w-full"
                    />
                </button>
            ) : (
                <Link href={`/product/${product.slug}`} className="block">
                    <ImagePlaceholder
                        src={product.assetUrl}
                        alt={product.name}
                        className="aspect-square w-full"
                    />
                </Link>
            )}

            <div className="flex flex-col gap-2 px-3 pb-3 pt-2.5">
                {product.isAddon ? (
                    <button type="button" onClick={add} className="text-left">
                        <h3 className="min-h-[35px] text-[13.5px] font-normal leading-[1.3] text-text">
                            {product.name}
                        </h3>
                    </button>
                ) : (
                    <Link href={`/product/${product.slug}`}>
                        <h3 className="min-h-[35px] text-[13.5px] font-normal leading-[1.3] text-text">
                            {product.name}
                        </h3>
                    </Link>
                )}

                <div className="flex items-center gap-[7px]">
                    {hasWeights && <WeightToggle value={weight} onChange={setWeight} />}

                    <button
                        ref={buttonRef}
                        type="button"
                        onClick={add}
                        disabled={pending || !variantId}
                        aria-label={`Добавить в корзину: ${product.name}`}
                        className={`btn btn-primary h-9 shrink-0 whitespace-nowrap rounded-full px-3
                            text-[12.5px] font-semibold disabled:is-disabled
                            ${hasWeights ? '' : 'flex-1'}`}
                    >
                        + {formatAmount(price)} ₽
                    </button>
                </div>
            </div>
        </article>
    );
}
