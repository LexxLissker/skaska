'use client';

import { useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { addToCart } from '@/app/actions/cart';
import type { BundleOffer } from '@/lib/api/catalog';
import { BUNDLES } from '@/lib/content';
import { flyToCart } from '@/lib/fly-to-cart';
import { formatPrice } from '@/lib/format';
import { ImagePlaceholder } from './image-placeholder';

/** Лента «Наборы для дома»: готовые комплекты, добавляются в корзину одной кнопкой. */
export function BundleRail({ offers }: { offers: BundleOffer[] }) {
    if (!offers.length) return null;

    return (
        <section className="pt-[22px]">
            <h2 className="mb-3 px-4 font-heading text-[22px] font-medium">Наборы для дома</h2>
            <div className="noscroll flex gap-3 overflow-x-auto px-4 pb-1">
                {BUNDLES.map(bundle => {
                    const offer = offers.find(o => o.slug === bundle.slug);
                    if (!offer) return null;
                    return <BundleCard key={bundle.slug} bundle={bundle} offer={offer} />;
                })}
            </div>
        </section>
    );
}

function BundleCard({
    bundle,
    offer,
}: {
    bundle: (typeof BUNDLES)[number];
    offer: BundleOffer;
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const buttonRef = useRef<HTMLButtonElement>(null);

    function add() {
        flyToCart(buttonRef.current);
        startTransition(async () => {
            await addToCart(offer.variantId, 1);
            router.refresh();
        });
    }

    return (
        <article className="panel flex w-60 shrink-0 flex-col overflow-hidden">
            <div className="relative h-[120px] w-full">
                <ImagePlaceholder
                    src={offer.assetUrl}
                    alt={bundle.title}
                    className="h-full w-full"
                    placeholder="Фото набора"
                />
                <span className="tag tag-accent absolute left-2.5 top-2.5">{bundle.tag}</span>
            </div>

            <div className="flex flex-1 flex-col gap-1.5 px-3.5 pb-3.5 pt-3">
                <h3 className="text-[15.5px] font-medium text-text">{bundle.title}</h3>
                <p className="text-[12.5px] text-text/65">{bundle.meta}</p>
                <p className="text-[12px] leading-relaxed text-text/50">{bundle.desc}</p>

                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <span className="text-[11.5px] text-text/45">Выгода в наборе</span>
                    <button
                        ref={buttonRef}
                        type="button"
                        onClick={add}
                        disabled={pending}
                        className="btn btn-primary h-8 shrink-0 whitespace-nowrap rounded-full px-3
                            text-[12px] font-semibold disabled:is-disabled"
                    >
                        В корзину · {formatPrice(offer.price)}
                    </button>
                </div>
            </div>
        </article>
    );
}
