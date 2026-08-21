'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
    chooseDeliveryRun,
    payOrder,
    setAddressAndGetOptions,
    setContactPhone,
    type DeliveryOptions,
    type DeliveryRunOption,
} from '@/app/actions/checkout';
import type { Cart } from '@/lib/api/cart';
import { formatPhone, formatPrice, isPhoneComplete, pluralRu } from '@/lib/format';
import { DeliverySection } from './delivery-section';
import { PaymentSheet } from './payment-sheet';

type PaymentMethod = 'sbp' | 'card';

export function CheckoutView({ initialCart }: { initialCart: Cart }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const [cart, setCart] = useState(initialCart);
    const [address, setAddress] = useState('');
    const [options, setOptions] = useState<DeliveryOptions | null>(null);
    const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

    const [phone, setPhone] = useState({ display: '', digits: '' });
    const [method, setMethod] = useState<PaymentMethod>('sbp');
    const [orderExpanded, setOrderExpanded] = useState(false);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function pickAddress(value: string) {
        setAddress(value);
        setError(null);
        startTransition(async () => {
            const result = await setAddressAndGetOptions(value);
            setOptions(result.options);
            if (result.cart) setCart(result.cart);

            // Ближайший рейс выбирается сам — в макете это состояние по умолчанию.
            const nearest = result.options.runs[0];
            if (nearest && result.options.zone) {
                setSelectedRunId(nearest.id);
                const updated = await chooseDeliveryRun(
                    nearest.id,
                    result.options.zone.code,
                    nearest.window,
                );
                if (updated) setCart(updated);
            }
        });
    }

    function pickRun(run: DeliveryRunOption) {
        if (!options?.zone) return;
        setSelectedRunId(run.id);
        startTransition(async () => {
            const updated = await chooseDeliveryRun(run.id, options.zone!.code, run.window);
            if (updated) setCart(updated);
        });
    }

    const ready =
        options?.zone != null && selectedRunId != null && isPhoneComplete(phone.digits);

    function startPayment() {
        setError(null);
        startTransition(async () => {
            const phoneError = await setContactPhone(phone.digits);
            if (phoneError) {
                setError(phoneError);
                return;
            }
            setSheetOpen(true);
        });
    }

    function confirmPayment() {
        startTransition(async () => {
            const result = await payOrder();
            if (result.error) {
                setError(result.error);
                setSheetOpen(false);
                return;
            }
            router.push(`/order/${result.orderCode}`);
        });
    }

    const discount = cart.discounts.reduce((sum, d) => sum + d.amount, 0);

    return (
        <>
            <header className="flex items-center gap-3 px-4 pb-1 pt-5">
                <button
                    type="button"
                    onClick={() => router.back()}
                    aria-label="Назад"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2"
                >
                    <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>
                <h1 className="font-heading text-[24px] font-medium">Оформление</h1>
            </header>

            <DeliverySection
                address={address}
                onAddressChange={setAddress}
                onAddressSelect={pickAddress}
                options={options}
                selectedRunId={selectedRunId}
                onRunSelect={pickRun}
                pending={pending}
            />

            {/* ── Контакты ──────────────────────────────────────────────────── */}
            <section className="card mx-4 mt-4 p-4">
                <h2 className="pb-3 font-heading text-[17px] font-medium">Контакты</h2>
                <label className="block text-[12px] text-text/70" htmlFor="phone">
                    Телефон
                </label>
                <input
                    id="phone"
                    inputMode="tel"
                    value={phone.display}
                    onChange={e => setPhone(formatPhone(e.target.value))}
                    placeholder="+7 (___) ___-__-__"
                    className="mt-1 min-h-9 w-full rounded-md border border-divider bg-surface-2 px-3
                        text-sm placeholder:text-text/45 focus-visible:border-accent"
                />
                <p className="pt-1.5 text-[11.5px] text-text/45">Пришлём статус заказа</p>
            </section>

            {/* ── Оплата ────────────────────────────────────────────────────── */}
            <section className="card mx-4 mt-4 p-4">
                <h2 className="pb-3 font-heading text-[17px] font-medium">Оплата</h2>
                <div className="flex flex-col gap-2" role="radiogroup" aria-label="Способ оплаты">
                    {(
                        [
                            { id: 'sbp', label: 'СБП', hint: 'Оплата в банковском приложении' },
                            { id: 'card', label: 'Банковская карта', hint: '' },
                        ] as const
                    ).map(option => {
                        const active = method === option.id;
                        return (
                            <button
                                key={option.id}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                onClick={() => setMethod(option.id)}
                                className={`flex items-center gap-3 rounded-md border px-3 py-2.5 text-left
                                    transition-colors
                                    ${
                                        active
                                            ? 'border-accent bg-[rgba(229,184,75,.07)]'
                                            : 'border-divider'
                                    }`}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`h-4 w-4 shrink-0 rounded-full border-[1.5px]
                                        ${active ? 'border-accent bg-accent shadow-[inset_0_0_0_3px_var(--color-bg)]' : 'border-divider'}`}
                                />
                                <span>
                                    <span className="block text-[14px]">{option.label}</span>
                                    {option.hint && (
                                        <span className="block text-[11.5px] text-text/45">
                                            {option.hint}
                                        </span>
                                    )}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* ── Товары ────────────────────────────────────────────────────── */}
            <section className="card mx-4 mt-4 p-4">
                <button
                    type="button"
                    onClick={() => setOrderExpanded(o => !o)}
                    aria-expanded={orderExpanded}
                    className="flex w-full items-center justify-between"
                >
                    <h2 className="text-[14.5px] font-medium text-text">
                        Состав заказа · {cart.totalQuantity}{' '}
                        {pluralRu(cart.totalQuantity, 'товар', 'товара', 'товаров')}
                    </h2>
                    <span
                        aria-hidden="true"
                        className={`text-text/50 transition-transform ${orderExpanded ? 'rotate-180' : ''}`}
                    >
                        ⌄
                    </span>
                </button>

                {orderExpanded && (
                    <ul className="mt-3 flex flex-col gap-2 border-t border-divider pt-3">
                        {cart.lines.map(line => (
                            <li key={line.id} className="flex justify-between gap-3 text-[13px]">
                                <span className="min-w-0 text-text/75">
                                    {line.productName}
                                    <span className="block text-[11.5px] text-text/45">
                                        {line.weight} · {line.variantLabel} · {line.quantity} шт
                                    </span>
                                </span>
                                <span className="shrink-0 font-heading">
                                    {formatPrice(line.linePrice)}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-3 border-t border-divider pt-3">
                    <SummaryRow label="Товары" value={formatPrice(cart.subTotal - discount)} />
                    {discount !== 0 && (
                        <SummaryRow
                            label="Промокод"
                            value={`−${formatPrice(Math.abs(discount))}`}
                        />
                    )}
                    <SummaryRow
                        label="Доставка"
                        value={
                            options?.zone
                                ? options.zone.cost === 0
                                    ? 'Бесплатно'
                                    : formatPrice(options.zone.cost)
                                : '—'
                        }
                    />
                    <div className="mt-2 flex items-center justify-between border-t border-divider pt-2.5">
                        <span className="text-[14px]">К оплате</span>
                        <span className="font-heading text-[20px] font-semibold text-accent">
                            {formatPrice(cart.subTotal + (options?.zone?.cost ?? 0))}
                        </span>
                    </div>
                </div>
            </section>

            {error && <p className="px-4 pt-3 text-[12.5px] text-red-400">{error}</p>}

            {/* ── Липкая кнопка оплаты ──────────────────────────────────────── */}
            <div className="fixed bottom-16 z-30 w-full max-w-[480px] border-t border-divider bg-bg/95 px-4 py-3 backdrop-blur-sm">
                <p className="mb-2 text-center text-[11px] leading-[1.35] text-text/45">
                    Нажимая «Оплатить», вы соглашаетесь с{' '}
                    <a href="/docs/oferta" className="text-accent-300 underline-offset-2 hover:underline">
                        условиями оферты
                    </a>{' '}
                    и{' '}
                    <a href="/docs/privacy" className="text-accent-300 underline-offset-2 hover:underline">
                        политикой конфиденциальности
                    </a>
                </p>
                <button
                    type="button"
                    onClick={startPayment}
                    disabled={!ready || pending}
                    className="btn-cta disabled:is-disabled"
                >
                    Оплатить {formatPrice(cart.subTotal + (options?.zone?.cost ?? 0))}
                </button>
            </div>

            <div className="h-36" />

            {sheetOpen && (
                <PaymentSheet
                    method={method}
                    amount={cart.subTotal + (options?.zone?.cost ?? 0)}
                    pending={pending}
                    onConfirm={confirmPayment}
                    onCancel={() => setSheetOpen(false)}
                />
            )}
        </>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-1">
            <span className="text-[13.5px] text-text/70">{label}</span>
            <span className="font-heading text-[14px]">{value}</span>
        </div>
    );
}
