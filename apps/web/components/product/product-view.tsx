'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState, useTransition } from 'react';

import { addToCart } from '@/app/actions/cart';
import { ImagePlaceholder } from '@/components/catalog/image-placeholder';
import { flyToCart } from '@/lib/fly-to-cart';
import type { ConfiguratorData, ProductDetail } from '@/lib/api/catalog';
import { formatAmount, formatPrice } from '@/lib/format';
import { OptionRow } from './option-row';

/** Значения по умолчанию совпадают с первым вариантом каждой группы на сервере. */
const DEFAULTS: Record<string, string> = {
    dough: 'standard',
    fat: 'broth',
    color: 'standard',
    texture: 'fine',
};

export function ProductView({
    product,
    configurator,
}: {
    product: ProductDetail;
    configurator: ConfiguratorData;
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const [weight, setWeight] = useState<'500' | '1000'>('500');
    const [quantity, setQuantity] = useState(1);
    const [options, setOptions] = useState<Record<string, string>>(DEFAULTS);
    const [error, setError] = useState<string | null>(null);

    const addButtonRef = useRef<HTMLButtonElement>(null);

    const variant =
        product.variants.find(v => v.weight === weight) ?? product.variants[0];
    const hasWeights = product.variants.length > 1;

    // Цена пересчитывается из того же справочника наценок, что и на сервере.
    // Сервер всё равно посчитает заново — здесь это только предпросмотр.
    const unitPrice = useMemo(() => {
        const surcharge = configurator.groups.reduce((sum, group) => {
            const choice = group.choices.find(c => c.id === options[group.code]);
            return sum + (choice?.delta ?? 0);
        }, 0);
        return (variant?.price ?? 0) + surcharge;
    }, [configurator.groups, options, variant]);

    // БЖУ на 100 г: базовое для категории плюс поправки выбранных опций.
    const bju = useMemo(() => {
        if (!configurator.baseBju) return null;
        const total = { ...configurator.baseBju };
        for (const group of configurator.groups) {
            const choice = group.choices.find(c => c.id === options[group.code]);
            if (!choice) continue;
            total.protein += choice.bju.protein;
            total.fat += choice.bju.fat;
            total.carbs += choice.bju.carbs;
            total.kcal += choice.bju.kcal;
        }
        return total;
    }, [configurator, options]);

    function handleAdd() {
        setError(null);
        if (!variant) return;

        flyToCart(addButtonRef.current);

        startTransition(async () => {
            const result = await addToCart(variant.id, quantity, options);
            if (result.error) {
                setError(result.error);
                return;
            }
            router.refresh();
        });
    }

    return (
        <>
            {/* ── Фото и название ───────────────────────────────────────────── */}
            <header className="relative">
                <ImagePlaceholder
                    src={product.assetUrl}
                    alt={product.name}
                    className="aspect-[4/3] w-full"
                />

                <button
                    type="button"
                    onClick={() => router.back()}
                    aria-label="Назад"
                    className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center
                        rounded-full bg-black/45 text-text backdrop-blur-sm"
                >
                    <svg
                        width="18"
                        height="18"
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

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg to-transparent px-4 pb-4 pt-14">
                    <h1 className="font-heading text-[23px] font-medium leading-tight">
                        {product.name}
                    </h1>
                </div>
            </header>

            {/* ── Вес, количество, добавление ───────────────────────────────── */}
            <div className="flex items-center gap-2 px-4 pt-4">
                {hasWeights && (
                    <div className="flex shrink-0 gap-1" role="group" aria-label="Вес">
                        {(['500', '1000'] as const).map(option => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => setWeight(option)}
                                aria-pressed={weight === option}
                                className={`rounded-full border px-2.5 py-1.5 font-heading text-[12px]
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

                <div className="flex shrink-0 items-center gap-1 rounded-full border border-divider px-1">
                    <StepperButton
                        label="Убрать один"
                        muted
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    >
                        −
                    </StepperButton>
                    <span className="min-w-[18px] text-center font-heading text-[14px]">
                        {quantity}
                    </span>
                    <StepperButton label="Добавить один" onClick={() => setQuantity(q => q + 1)}>
                        +
                    </StepperButton>
                </div>

                <button
                    ref={addButtonRef}
                    type="button"
                    onClick={handleAdd}
                    disabled={pending || !variant}
                    className="btn-gradient min-w-0 flex-1 rounded-md py-2.5 font-heading
                        text-[14px] font-semibold disabled:is-disabled"
                >
                    {pending ? 'Добавляем…' : `+ ${formatAmount(unitPrice * quantity)} ₽`}
                </button>
            </div>

            {error && <p className="px-4 pt-2 text-[12.5px] text-red-400">{error}</p>}

            {/* ── БЖУ ───────────────────────────────────────────────────────── */}
            {bju && (
                <p className="px-4 pt-3 text-[12px] text-text/50">
                    На 100 г: белки {bju.protein.toFixed(0)} г · жиры {bju.fat.toFixed(0)} г ·
                    углеводы {bju.carbs.toFixed(0)} г · {bju.kcal.toFixed(0)} ккал
                </p>
            )}

            {/* ── Группы опций ──────────────────────────────────────────────── */}
            {configurator.groups.map(group => (
                <OptionRow
                    key={group.code}
                    group={group}
                    value={options[group.code] ?? group.choices[0].id}
                    onChange={choiceId =>
                        setOptions(current => ({ ...current, [group.code]: choiceId }))
                    }
                />
            ))}

            {/* ── С чем подать ──────────────────────────────────────────────── */}
            {configurator.addons.length > 0 && (
                <section className="pt-7">
                    <h2 className="px-4 pb-3 font-heading text-[22px] font-medium">С чем подать?</h2>
                    <div className="noscroll flex gap-3 overflow-x-auto px-4 pb-1">
                        {configurator.addons.map(addon => (
                            <AddonCard key={addon.id} addon={addon} onAdded={() => router.refresh()} />
                        ))}
                    </div>
                </section>
            )}

            {/* ── Описание ──────────────────────────────────────────────────── */}
            <section className="px-4 pb-10 pt-7">
                <h2 className="pb-2 font-heading text-[22px] font-medium">Описание</h2>
                <div
                    className="text-[13px] leading-relaxed text-text/60"
                    // Описание приходит из админки как размеченный текст.
                    dangerouslySetInnerHTML={{ __html: product.description }}
                />
            </section>
        </>
    );
}

function StepperButton({
    children,
    label,
    muted = false,
    onClick,
}: {
    children: React.ReactNode;
    label: string;
    muted?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className={`flex h-7 w-7 items-center justify-center font-heading text-[16px]
                ${muted ? 'text-text/45' : 'text-accent'}`}
        >
            {children}
        </button>
    );
}

function AddonCard({
    addon,
    onAdded,
}: {
    addon: { id: string; name: string; price: number; productVariantId: string | null };
    onAdded: () => void;
}) {
    const [pending, startTransition] = useTransition();
    const buttonRef = useRef<HTMLButtonElement>(null);

    function add() {
        if (!addon.productVariantId) return;
        flyToCart(buttonRef.current);
        startTransition(async () => {
            await addToCart(addon.productVariantId!, 1);
            onAdded();
        });
    }

    return (
        <article className="card flex w-[170px] shrink-0 flex-col justify-between p-3">
            <h3 className="line-clamp-3 text-[13px] leading-snug">{addon.name}</h3>
            <div className="mt-3 flex items-center justify-between">
                <span
                    className="font-heading text-[14px] font-medium text-[#E5B84B]"
                    style={{ textShadow: '0 0 10px rgba(229,184,75,.25)' }}
                >
                    {formatPrice(addon.price)}
                </span>
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={add}
                    disabled={pending || !addon.productVariantId}
                    aria-label={`Добавить: ${addon.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-full border
                        border-accent font-heading text-[15px] text-accent disabled:is-disabled"
                >
                    +
                </button>
            </div>
        </article>
    );
}
