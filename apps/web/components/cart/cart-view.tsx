'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { applyPromoCode, removePromoCode, setLineQuantity } from '@/app/actions/cart';
import { ImagePlaceholder } from '@/components/catalog/image-placeholder';
import type { Cart } from '@/lib/api/cart';
import { formatPrice, pluralRu } from '@/lib/format';

/**
 * Корзина. В макете экран разложен на три карточки: позиции, промокод и
 * итоги, а кнопка оформления живёт в липком подвале.
 */
export function CartView({ cart }: { cart: Cart | null }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const [promoInput, setPromoInput] = useState('');
    const [promoError, setPromoError] = useState<string | null>(null);

    const isEmpty = !cart || cart.lines.length === 0;
    const positionCount = cart?.lines.length ?? 0;
    const appliedCode = cart?.couponCodes[0] ?? null;
    const discount = cart?.discounts.reduce((sum, d) => sum + d.amount, 0) ?? 0;

    function changeQuantity(lineId: string, quantity: number) {
        startTransition(async () => {
            await setLineQuantity(lineId, quantity);
            router.refresh();
        });
    }

    function applyPromo() {
        setPromoError(null);
        startTransition(async () => {
            const result = await applyPromoCode(promoInput);
            if (result.error) {
                setPromoError(result.error);
                return;
            }
            setPromoInput('');
            router.refresh();
        });
    }

    function removePromo() {
        if (!appliedCode) return;
        startTransition(async () => {
            await removePromoCode(appliedCode);
            router.refresh();
        });
    }

    return (
        <>
            <header className="flex items-center gap-3 px-[18px] pb-[18px] pt-4 lg:mx-auto lg:w-full
                lg:max-w-[1200px] lg:px-8 lg:pb-6 lg:pt-8">
                <button
                    type="button"
                    onClick={() => router.back()}
                    aria-label="Назад"
                    className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full
                        border border-divider bg-surface"
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--color-text)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M15 5l-7 7 7 7" />
                    </svg>
                </button>
                <h2 className="m-0 text-[21px] font-medium text-text lg:text-[32px]">Корзина</h2>
            </header>

            <div className={`flex flex-col gap-[14px] px-[18px] pb-[18px]
                lg:mx-auto lg:grid lg:w-full lg:max-w-[1200px] lg:grid-cols-[minmax(0,1fr)_380px]
                lg:items-start lg:gap-6 lg:px-8 lg:pb-16 ${pending ? 'opacity-60' : ''}`}>
                {/* ── Позиции ───────────────────────────────────────────────── */}
                <section className={`panel p-4 lg:p-6 ${isEmpty ? 'lg:col-span-2' : ''}`}>
                    {isEmpty ? (
                        <>
                            <p className="mb-1.5 text-[14.5px] font-medium text-text">Корзина пуста</p>
                            <p className="text-[12.5px] leading-[1.5] text-text/60">
                                Добавьте блюда из каталога, чтобы оформить заказ
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="mb-1 text-[14.5px] font-medium text-text">
                                {positionCount}{' '}
                                {pluralRu(positionCount, 'товар', 'товара', 'товаров')}
                            </p>
                            <ul className="flex flex-col">
                                {cart.lines.map(line => (
                                    <li
                                        key={line.id}
                                        className="flex items-start gap-3 border-b border-divider py-[14px] last:border-0 lg:gap-4 lg:py-5"
                                    >
                                        <div className="shrink-0">
                                            {line.assetUrl ? (
                                                <ImagePlaceholder
                                                    src={line.assetUrl}
                                                    alt={line.productName}
                                                    className="h-16 w-16 rounded-md lg:h-24 lg:w-24"
                                                />
                                            ) : (
                                                <div
                                                    className="flex h-16 w-16 items-center justify-center rounded-md
                                                        border border-dashed border-text/35 bg-surface-2 px-1 text-center
                                                        text-[11px] font-medium leading-[1.2] text-text/55 lg:h-24 lg:w-24"
                                                    role="img"
                                                    aria-label={`Фото товара: ${line.productName}`}
                                                >
                                                    Фото<br />товара
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                            <span className="text-[13.5px] text-text lg:text-[16px]">
                                                {line.productName}
                                            </span>
                                            <span className="text-[11.5px] text-text/55">
                                                {line.variantLabel}
                                            </span>
                                            <span className="text-[11.5px] text-text/55">
                                                {line.weight}
                                            </span>

                                            <div className="mt-2 flex items-center gap-1.5 self-start py-1">
                                                <button
                                                    type="button"
                                                    aria-label="Убрать одну"
                                                    onClick={() =>
                                                        changeQuantity(line.id, line.quantity - 1)
                                                    }
                                                    className="flex h-5 w-5 items-center justify-center
                                                        text-[15px] leading-none text-text/60"
                                                >
                                                    −
                                                </button>
                                                <span className="min-w-[14px] text-center text-[13px] text-text">
                                                    {line.quantity}
                                                </span>
                                                <button
                                                    type="button"
                                                    aria-label="Добавить ещё одну"
                                                    onClick={() =>
                                                        changeQuantity(line.id, line.quantity + 1)
                                                    }
                                                    className="flex h-5 w-5 items-center justify-center
                                                        text-[15px] leading-none text-accent"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        <span className="shrink-0 text-[14px] font-medium text-text">
                                            {formatPrice(line.linePrice)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </section>

                {!isEmpty && (
                    <aside className="flex flex-col gap-[14px] lg:sticky lg:top-[104px] lg:self-start">
                        {/* ── Промокод ──────────────────────────────────────── */}
                        <section className="panel p-4">
                            <p className="mb-3 text-[15px] font-medium text-text">Промокод</p>

                            {appliedCode ? (
                                <div className="flex items-center justify-between gap-2.5">
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-heading text-[14.5px] font-semibold text-accent">
                                            {appliedCode}
                                        </span>
                                        <span className="text-[12px] text-text/60">
                                            −{formatPrice(Math.abs(discount))}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={removePromo}
                                        aria-label="Убрать промокод"
                                        className="flex h-6 w-6 items-center justify-center rounded-full
                                            border border-divider text-[14px] leading-none text-text/60"
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex gap-2">
                                        <input
                                            className="input flex-1"
                                            placeholder="Введите промокод"
                                            aria-label="Промокод"
                                            value={promoInput}
                                            onChange={e => setPromoInput(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={applyPromo}
                                            disabled={!promoInput.trim()}
                                            className="btn btn-secondary h-11 shrink-0 px-4 disabled:is-disabled"
                                        >
                                            Применить
                                        </button>
                                    </div>
                                    {promoError && (
                                        <p className="mt-2 text-[12px] text-text/55">{promoError}</p>
                                    )}
                                </>
                            )}
                        </section>

                        {/* ── Итоги ─────────────────────────────────────────── */}
                        <section className="panel p-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[13.5px] text-text/70">Товары</span>
                                    <span className="text-[13.5px] text-text">
                                        {formatPrice(cart.subTotal - discount)}
                                    </span>
                                </div>

                                {discount !== 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[13.5px] text-text/70">Скидка</span>
                                        <span className="text-[13.5px] text-accent">
                                            −{formatPrice(Math.abs(discount))}
                                        </span>
                                    </div>
                                )}

                                <div className="mt-1 flex items-center justify-between border-t border-divider pt-2.5">
                                    <span className="text-[15px] font-medium text-text">Итого</span>
                                    <span className="font-heading text-[18px] font-semibold text-accent">
                                        {formatPrice(cart.subTotal)}
                                    </span>
                                </div>
                            </div>
                        </section>
                        <Link
                            href="/checkout"
                            className="btn-cta hidden items-center justify-center lg:flex"
                        >
                            Оформить заказ · {formatPrice(cart.subTotal)}
                        </Link>
                        <p className="hidden text-center text-[11.5px] leading-relaxed text-text/40 lg:block">
                            Стоимость доставки рассчитаем после выбора адреса
                        </p>
                    </aside>
                )}
            </div>

            {/* ── Липкий подвал ─────────────────────────────────────────────── */}
            <div className="fixed bottom-16 z-30 w-full max-w-[412px] border-t border-divider bg-bg px-[18px] pb-[18px] pt-[14px] lg:hidden">
                <Link
                    href="/checkout"
                    aria-disabled={isEmpty}
                    className={`btn-cta flex items-center justify-center ${isEmpty ? 'is-disabled' : ''}`}
                >
                    {isEmpty ? 'Корзина пуста' : `Оформить заказ · ${formatPrice(cart.subTotal)}`}
                </Link>
            </div>

            {/* Компенсируем высоту липкого подвала. */}
            <div className="h-[104px] lg:hidden" />
        </>
    );
}
