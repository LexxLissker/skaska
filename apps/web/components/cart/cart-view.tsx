'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { applyPromoCode, removePromoCode, setLineQuantity } from '@/app/actions/cart';
import { ImagePlaceholder } from '@/components/catalog/image-placeholder';
import type { Cart } from '@/lib/api/cart';
import { formatPrice } from '@/lib/format';

export function CartView({ cart }: { cart: Cart | null }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const [promoInput, setPromoInput] = useState('');
    const [promoError, setPromoError] = useState<string | null>(null);

    const isEmpty = !cart || cart.lines.length === 0;
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
            <header className="px-4 pb-2 pt-5">
                <h1 className="font-heading text-[26px] font-medium">Корзина</h1>
            </header>

            {isEmpty ? (
                <div className="px-4 py-16 text-center">
                    <p className="text-[14px] text-text/55">Корзина пуста</p>
                    <Link
                        href="/"
                        className="mt-4 inline-block rounded-md border border-divider px-4 py-2
                            font-heading text-[14px] text-text/80 hover:border-accent hover:text-accent"
                    >
                        В каталог
                    </Link>
                </div>
            ) : (
                <div className={pending ? 'opacity-60' : ''}>
                    {/* ── Позиции ───────────────────────────────────────────── */}
                    <ul className="flex flex-col px-4">
                        {cart.lines.map(line => (
                            <li
                                key={line.id}
                                className="flex gap-3 border-b border-divider py-3 last:border-0"
                            >
                                <Link href={`/product/${line.productSlug}`} className="shrink-0">
                                    <ImagePlaceholder
                                        src={line.assetUrl}
                                        alt={line.productName}
                                        className="h-16 w-16 rounded-lg"
                                    />
                                </Link>

                                <div className="min-w-0 flex-1">
                                    <Link href={`/product/${line.productSlug}`}>
                                        <p className="line-clamp-2 text-[13.5px] leading-snug">
                                            {line.productName}
                                        </p>
                                    </Link>
                                    <p className="mt-0.5 text-[12px] text-text/50">
                                        {line.weight} · {line.variantLabel}
                                    </p>

                                    <div className="mt-2 flex items-center justify-between">
                                        <div className="flex items-center gap-1 rounded-full border border-divider px-1">
                                            <button
                                                type="button"
                                                aria-label="Уменьшить количество"
                                                onClick={() =>
                                                    changeQuantity(line.id, line.quantity - 1)
                                                }
                                                className="flex h-7 w-7 items-center justify-center
                                                    font-heading text-[16px] text-text/45"
                                            >
                                                −
                                            </button>
                                            <span className="min-w-[18px] text-center font-heading text-[13.5px]">
                                                {line.quantity}
                                            </span>
                                            <button
                                                type="button"
                                                aria-label="Увеличить количество"
                                                onClick={() =>
                                                    changeQuantity(line.id, line.quantity + 1)
                                                }
                                                className="flex h-7 w-7 items-center justify-center
                                                    font-heading text-[16px] text-accent"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <span className="font-heading text-[14px] font-medium">
                                            {formatPrice(line.linePrice)}
                                        </span>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {/* ── Промокод ──────────────────────────────────────────── */}
                    <section className="px-4 pt-4">
                        {appliedCode ? (
                            <div className="flex items-center justify-between rounded-md border border-divider bg-surface px-3 py-2.5">
                                <div>
                                    <span className="font-heading text-[13.5px] font-semibold text-accent">
                                        {appliedCode}
                                    </span>
                                    <span className="ml-2 text-[12.5px] text-text/55">
                                        −{formatPrice(Math.abs(discount))}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={removePromo}
                                    aria-label="Убрать промокод"
                                    className="px-2 text-[16px] text-text/45 hover:text-accent"
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex gap-2">
                                    <input
                                        value={promoInput}
                                        onChange={e => setPromoInput(e.target.value)}
                                        placeholder="Промокод"
                                        aria-label="Промокод"
                                        className="min-h-9 w-full rounded-md border border-divider bg-surface-2
                                            px-3 text-sm uppercase placeholder:normal-case
                                            placeholder:text-text/45 focus-visible:border-accent"
                                    />
                                    <button
                                        type="button"
                                        onClick={applyPromo}
                                        disabled={!promoInput.trim()}
                                        className="shrink-0 rounded-md border border-divider px-4
                                            font-heading text-[13.5px] text-text/80
                                            hover:border-accent hover:text-accent disabled:is-disabled"
                                    >
                                        Применить
                                    </button>
                                </div>
                                {promoError && (
                                    <p className="pt-1.5 text-[12.5px] text-red-400">{promoError}</p>
                                )}
                            </>
                        )}
                    </section>

                    {/* ── Итоги ─────────────────────────────────────────────── */}
                    <section className="card mx-4 mt-4 p-4">
                        <Row label="Товары" value={formatPrice(cart.subTotal - discount)} />
                        {discount !== 0 && (
                            <Row
                                label="Скидка"
                                value={`−${formatPrice(Math.abs(discount))}`}
                                muted
                            />
                        )}
                        <div className="mt-2 flex items-center justify-between border-t border-divider pt-2.5">
                            <span className="text-[14px]">Итого</span>
                            <span className="font-heading text-[19px] font-semibold text-accent">
                                {formatPrice(cart.subTotal)}
                            </span>
                        </div>
                        <p className="pt-1 text-[11.5px] text-text/45">
                            Доставку посчитаем на следующем шаге — она зависит от вашей зоны
                        </p>
                    </section>
                </div>
            )}

            {/* ── Липкая кнопка ─────────────────────────────────────────────── */}
            <div className="fixed bottom-16 z-30 w-full max-w-[480px] border-t border-divider bg-bg/95 px-4 py-3 backdrop-blur-sm">
                <Link
                    href="/checkout"
                    aria-disabled={isEmpty}
                    className={`btn-gradient block rounded-md py-3 text-center font-heading
                        text-[15px] font-semibold ${isEmpty ? 'is-disabled' : ''}`}
                >
                    {isEmpty ? 'Оформить заказ' : `Оформить заказ · ${formatPrice(cart.subTotal)}`}
                </Link>
            </div>

            {/* Компенсируем высоту липкой кнопки, чтобы она не перекрывала итоги. */}
            <div className="h-20" />
        </>
    );
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
    return (
        <div className="flex items-center justify-between py-1">
            <span className={`text-[13.5px] ${muted ? 'text-text/55' : 'text-text/80'}`}>
                {label}
            </span>
            <span className="font-heading text-[14px]">{value}</span>
        </div>
    );
}
