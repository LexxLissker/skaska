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

    const ready = options?.zone != null && selectedRunId != null && isPhoneComplete(phone.digits);

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
    const deliveryCost = options?.zone?.cost ?? null;
    const total = cart.subTotal + (deliveryCost ?? 0);
    const positionCount = cart.lines.length;

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
                <h2 className="m-0 text-[21px] font-medium text-text lg:text-[32px]">Оформление заказа</h2>
            </header>

            <div className="flex flex-col gap-[14px] px-[18px] pb-[18px] lg:mx-auto lg:grid
                lg:w-full lg:max-w-[1200px] lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start
                lg:gap-6 lg:px-8 lg:pb-16">
                <div className="flex flex-col gap-[14px]">
                <DeliverySection
                    address={address}
                    onAddressChange={setAddress}
                    onAddressSelect={pickAddress}
                    options={options}
                    selectedRunId={selectedRunId}
                    onRunSelect={pickRun}
                    pending={pending}
                />

                {/* ── Контакты ──────────────────────────────────────────────── */}
                <section className="panel p-4">
                    <p className="mb-3 text-[15px] font-medium text-text">Контакты</p>
                    <div className="field">
                        <label htmlFor="phone">Телефон</label>
                        <input
                            id="phone"
                            className="input"
                            inputMode="tel"
                            placeholder="+7 (___) ___-__-__"
                            value={phone.display}
                            onChange={e => setPhone(formatPhone(e.target.value))}
                        />
                    </div>
                    <p className="mt-2 text-[12px] text-text opacity-70">Пришлём статус заказа</p>
                </section>

                {/* ── Оплата ────────────────────────────────────────────────── */}
                <section className="panel p-4">
                    <p className="mb-3 text-[15px] font-medium text-text">Оплата</p>
                    <div className="flex flex-col gap-2.5">
                        <PaymentRow
                            active={method === 'sbp'}
                            onSelect={() => setMethod('sbp')}
                            label="СБП"
                            hint="Оплата в банковском приложении"
                        />
                        <PaymentRow
                            active={method === 'card'}
                            onSelect={() => setMethod('card')}
                            label="Банковская карта"
                        />
                    </div>
                </section>
                </div>

                {/* ── Состав заказа ─────────────────────────────────────────── */}
                <aside className="flex flex-col gap-[14px] lg:sticky lg:top-[104px] lg:self-start">
                <section className="panel p-4 lg:p-5">
                    <button
                        type="button"
                        onClick={() => setOrderExpanded(o => !o)}
                        aria-expanded={orderExpanded}
                        className="flex w-full items-center justify-between"
                    >
                        <span className="text-[14.5px] font-medium text-text">
                            Состав заказа · {positionCount}{' '}
                            {pluralRu(positionCount, 'товар', 'товара', 'товаров')}
                        </span>
                        <span
                            aria-hidden="true"
                            className={`text-text/50 transition-transform lg:hidden ${orderExpanded ? 'rotate-180' : ''}`}
                        >
                            ⌄
                        </span>
                    </button>

                    <div className={`${orderExpanded ? 'flex' : 'hidden lg:flex'} mt-2.5 flex-col gap-2 border-t border-divider pt-2.5`}>
                            {cart.lines.map(line => (
                                <div
                                    key={line.id}
                                    className="flex items-center justify-between gap-2.5"
                                >
                                    <div className="flex min-w-0 flex-col gap-0.5">
                                        <span className="text-[13px] text-text">
                                            {line.productName}
                                        </span>
                                        <span className="text-[11.5px] text-text/55">
                                            {[
                                                line.variantLabel,
                                                line.weight,
                                                line.quantity > 1 ? `×${line.quantity}` : null,
                                            ]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </span>
                                    </div>
                                    <span className="shrink-0 text-[13px] text-text">
                                        {formatPrice(line.linePrice)}
                                    </span>
                                </div>
                            ))}
                    </div>

                    <div className="mt-3.5 flex flex-col gap-2 border-t border-divider pt-3.5">
                        <SummaryRow
                            label="Товары"
                            value={formatPrice(cart.subTotal - discount)}
                        />
                        {discount !== 0 && (
                            <SummaryRow
                                label={`Промокод ${cart.couponCodes[0] ?? ''}`.trim()}
                                value={`−${formatPrice(Math.abs(discount))}`}
                                accent
                            />
                        )}
                        <SummaryRow
                            label="Доставка"
                            value={
                                deliveryCost === null
                                    ? '—'
                                    : deliveryCost === 0
                                      ? 'Бесплатно'
                                      : formatPrice(deliveryCost)
                            }
                            accent={deliveryCost === 0}
                        />
                        <div className="mt-1 flex items-center justify-between border-t border-divider pt-2.5">
                            <span className="text-[15px] font-medium text-text">К оплате</span>
                            <span className="font-heading text-[18px] font-semibold text-accent">
                                {formatPrice(total)}
                            </span>
                        </div>
                    </div>
                </section>

                {error && <p className="text-center text-[12.5px] text-red-400">{error}</p>}

                <p className="px-2 pb-1 pt-0.5 text-center text-[11.5px] leading-[1.5] text-text/45">
                    Нажимая «Оплатить», вы соглашаетесь с{' '}
                    <a href="/docs#oferta" className="text-accent-300">
                        условиями оферты
                    </a>{' '}
                    и{' '}
                    <a href="/docs#privacy" className="text-accent-300">
                        политикой конфиденциальности
                    </a>
                </p>
                <button
                    type="button"
                    onClick={startPayment}
                    disabled={!ready || pending}
                    className="btn-cta hidden disabled:is-disabled lg:block"
                >
                    Оплатить {formatPrice(total)}
                </button>
                </aside>
            </div>

            {/* ── Липкий подвал ─────────────────────────────────────────────── */}
            <div className="fixed bottom-16 z-30 w-full max-w-[412px] border-t border-divider bg-bg px-[18px] pb-[18px] pt-[14px] lg:hidden">
                <button
                    type="button"
                    onClick={startPayment}
                    disabled={!ready || pending}
                    className="btn-cta disabled:is-disabled"
                >
                    Оплатить {formatPrice(total)}
                </button>
            </div>

            <div className="h-[104px] lg:hidden" />

            {sheetOpen && (
                <PaymentSheet
                    method={method}
                    amount={total}
                    pending={pending}
                    onConfirm={confirmPayment}
                    onCancel={() => setSheetOpen(false)}
                />
            )}
        </>
    );
}

/** Строка выбора способа оплаты на радиокнопке дизайн-системы. */
function PaymentRow({
    active,
    onSelect,
    label,
    hint,
}: {
    active: boolean;
    onSelect: () => void;
    label: string;
    hint?: string;
}) {
    return (
        <label
            className={`radio w-full cursor-pointer items-start gap-3 rounded-md border p-3.5
                ${active ? 'border-accent bg-surface-2' : 'border-divider bg-transparent'}`}
        >
            <input type="radio" name="paymethod" checked={active} onChange={onSelect} />
            <span className="dot" />
            <span className="flex flex-col gap-0.5">
                <span className="text-[14.5px] font-medium text-text">{label}</span>
                {hint && <span className="text-[12px] text-text/60">{hint}</span>}
            </span>
        </label>
    );
}

function SummaryRow({
    label,
    value,
    accent = false,
}: {
    label: string;
    value: string;
    accent?: boolean;
}) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-[13.5px] text-text/70">{label}</span>
            <span className={`text-[13.5px] ${accent ? 'text-accent' : 'text-text'}`}>{value}</span>
        </div>
    );
}
