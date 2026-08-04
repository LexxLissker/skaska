'use client';

import Link from 'next/link';
import { useState } from 'react';

import type { ProductCard as ProductCardType } from '@/lib/api/catalog';
import { formatPrice } from '@/lib/format';
import { ImagePlaceholder } from './image-placeholder';

/**
 * Карточка каталога: фото, название, переключатель веса и цена.
 *
 * Вес выбирается прямо в сетке — в макете это два маленьких переключателя
 * под названием, чтобы не заходить в карточку ради сравнения цен.
 */
export function ProductCard({ product }: { product: ProductCardType }) {
    const [weight, setWeight] = useState<'500' | '1000'>('500');

    // У дополнений «Гастролавки» веса нет — обе цены одинаковые.
    const hasWeights = product.prices['500'] !== product.prices['1000'];
    const price = product.prices[weight] || product.prices['500'];

    return (
        <article className="card overflow-hidden">
            <Link href={`/product/${product.slug}`} className="block">
                <ImagePlaceholder
                    src={product.assetUrl}
                    alt={product.name}
                    className="aspect-square w-full"
                />
            </Link>

            <div className="p-2.5">
                <Link href={`/product/${product.slug}`}>
                    <h3 className="line-clamp-2 min-h-[2.6em] text-[13px] leading-snug text-text">
                        {product.name}
                    </h3>
                </Link>

                {hasWeights && (
                    <div className="mt-2 flex gap-1" role="group" aria-label="Вес">
                        {(['500', '1000'] as const).map(option => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => setWeight(option)}
                                aria-pressed={weight === option}
                                className={`flex-1 rounded-full border py-1 font-heading text-[11.5px]
                                    transition-colors
                                    ${
                                        weight === option
                                            ? 'chip-active bg-surface-2 text-accent'
                                            : 'border-divider text-text/55'
                                    }`}
                            >
                                {option === '500' ? '0.5 кг' : '1 кг'}
                            </button>
                        ))}
                    </div>
                )}

                <p className="mt-2 font-heading text-[15px] font-medium text-accent-300">
                    {formatPrice(price)}
                </p>
            </div>
        </article>
    );
}
