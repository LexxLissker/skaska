'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState, useTransition } from 'react';

import { addToCart } from '@/app/actions/cart';
import { ImagePlaceholder } from '@/components/catalog/image-placeholder';
import { flyToCart } from '@/lib/fly-to-cart';
import type { ConfiguratorData, ProductDetail } from '@/lib/api/catalog';
import { formatAmount } from '@/lib/format';
import { OptionRow } from './option-row';
import { UpsellSheet } from './upsell-sheet';

/** Значения по умолчанию совпадают с первым вариантом каждой группы на сервере. */
const DEFAULTS: Record<string, string> = {
    dough: 'standard',
    fat: 'broth',
    color: 'standard',
    texture: 'fine',
};

/** Общий для всех товаров текст: конкретика — на упаковке. */
const DESCRIPTION =
    'Замороженный полуфабрикат ручной лепки. Хранить при -18°C, готовить из ' +
    'замороженного, не размораживая. Состав и время приготовления уточняются на упаковке.';

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
    const [upsellOpen, setUpsellOpen] = useState(false);

    const addButtonRef = useRef<HTMLButtonElement>(null);
    const isAddon = product.categoryCode === 'gastrolavka';
    const productGroups = isAddon ? [] : configurator.groups;
    const productAddons = isAddon ? [] : configurator.addons;

    // Предлагаем первое подходящее дополнение — так в прототипе.
    const upsellAddon = productAddons.find(a => a.productVariantId) ?? null;

    const variant = product.variants.find(v => v.weight === weight) ?? product.variants[0];
    const hasWeights = product.variants.length > 1;

    const choiceOf = (code: string) =>
        configurator.groups
            .find(g => g.code === code)
            ?.choices.find(c => c.id === (options[code] ?? DEFAULTS[code]));

    // Цена — предпросмотр из того же справочника наценок, что и на сервере.
    // Окончательную всё равно считает Vendure при добавлении в заказ.
    const unitPrice = useMemo(() => {
        const surcharge = productGroups.reduce((sum, group) => {
            const choice = group.choices.find(c => c.id === options[group.code]);
            return sum + (choice?.delta ?? 0);
        }, 0);
        return (variant?.price ?? 0) + surcharge;
    }, [options, productGroups, variant]);

    // БЖУ на 100 г: базовое для категории плюс поправки выбранных опций.
    const bju = useMemo(() => {
        if (!configurator.baseBju) return null;
        const total = { ...configurator.baseBju };
        for (const group of productGroups) {
            const choice = group.choices.find(c => c.id === options[group.code]);
            if (!choice) continue;
            total.protein += choice.bju.protein;
            total.fat += choice.bju.fat;
            total.carbs += choice.bju.carbs;
            total.kcal += choice.bju.kcal;
        }
        return total;
    }, [configurator.baseBju, options, productGroups]);

    // Состав собирается из выбранных опций: мука, начинка, жир, краситель.
    const composition = useMemo(() => {
        const flour = choiceOf('dough')?.ingredient;
        if (!flour) return null;

        const texture = choiceOf('texture')?.ingredient ?? '';
        const fat = choiceOf('fat')?.ingredient ?? '';
        const dye = choiceOf('color')?.ingredient;

        const inside = [texture, fat].filter(Boolean).join(', ') + (dye ? `, ${dye}` : '');
        return `${flour.charAt(0).toUpperCase()}${flour.slice(1)}, вода, начинка (${inside}), соль, специи.`;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [configurator, options]);

    function handleAdd() {
        setError(null);
        if (!variant) return;

        flyToCart(addButtonRef.current);

        startTransition(async () => {
            try {
                const result = await addToCart(variant.id, quantity, options);
                if (result.error) {
                    setError(result.error);
                    return;
                }
                // После добавления товара шеф предлагает дополнение.
                if (upsellAddon) setUpsellOpen(true);
                setQuantity(1);
                router.refresh();
            } catch {
                setError('Не удалось добавить товар. Попробуйте ещё раз.');
            }
        });
    }

    function addUpsell() {
        if (!upsellAddon?.productVariantId) return;
        startTransition(async () => {
            await addToCart(upsellAddon.productVariantId!, 1);
            setUpsellOpen(false);
            router.refresh();
        });
    }

    return (
        <>
            {/* ── Фото 4:3 с названием поверх ───────────────────────────────── */}
            <header className="relative aspect-[4/3] w-full">
                <ImagePlaceholder
                    src={product.assetUrl}
                    alt={product.name}
                    className="h-full w-full"
                    placeholder="Фото товара"
                />

                <button
                    type="button"
                    onClick={() => router.back()}
                    aria-label="Назад"
                    className="absolute left-[14px] top-[14px] flex h-[38px] w-[38px] items-center
                        justify-center rounded-full bg-[color-mix(in_srgb,var(--color-bg)_65%,transparent)]"
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

                <h1 className="absolute inset-x-[18px] bottom-[14px] m-0 text-[20px] font-medium text-[#eef6ff] text-pretty">
                    {product.name}
                </h1>
            </header>

            <div className="px-[18px] pb-2 pt-[18px]">
                {/* ── Вес · количество · добавить ───────────────────────────── */}
                <div className="mb-3 flex items-center justify-between gap-2">
                    {hasWeights && (
                        <div className="flex gap-2" role="radiogroup" aria-label="Вес">
                            {(['500', '1000'] as const).map(option => {
                                const active = weight === option;
                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        role="radio"
                                        aria-checked={active}
                                        onClick={() => setWeight(option)}
                                        className={`rounded-full border px-4 py-[7px] text-[13.5px]
                                            font-medium transition-colors
                                            ${
                                                active
                                                    ? 'border-accent bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)] text-accent'
                                                    : 'border-divider bg-transparent text-[#a5b8de]'
                                            }`}
                                    >
                                        {option} г
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex items-center gap-2 rounded-md border border-divider px-2 py-[5px]">
                        <button
                            type="button"
                            aria-label="Убрать один"
                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                            className="h-[22px] w-[22px] text-[16px] leading-none text-text"
                        >
                            −
                        </button>
                        <span className="min-w-[14px] text-center text-[14px]">{quantity}</span>
                        <button
                            type="button"
                            aria-label="Добавить один"
                            onClick={() => setQuantity(q => q + 1)}
                            className="h-[22px] w-[22px] text-[16px] leading-none text-text"
                        >
                            +
                        </button>
                    </div>

                    <button
                        ref={addButtonRef}
                        type="button"
                        onClick={handleAdd}
                        disabled={pending || !variant}
                        className="btn btn-primary h-[34px] shrink-0 whitespace-nowrap px-[14px]
                            text-[14px] disabled:is-disabled"
                    >
                        {pending ? 'Добавляем…' : `+ ${formatAmount(unitPrice * quantity)} ₽`}
                    </button>
                </div>

                {error && <p className="mb-2 text-[12.5px] text-red-400">{error}</p>}

                {/* ── Б/Ж/У ─────────────────────────────────────────────────── */}
                {bju && !isAddon && (
                    <p className="mb-[14px] text-[12px] text-text/60">
                        Б/Ж/У на 100 г: {Math.round(bju.protein)} / {Math.round(bju.fat)} /{' '}
                        {Math.round(bju.carbs)} г · {Math.round(bju.kcal)} ккал
                    </p>
                )}
            </div>

            {/* ── Группы опций ──────────────────────────────────────────────── */}
            {productGroups.map(group => (
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
            {productAddons.length > 0 && (
                <section className="pb-2">
                    <h2 className="px-[18px] pb-2 text-[15px] font-medium">С чем подать?</h2>
                    <div className="noscroll flex gap-2 overflow-x-auto px-[18px] pb-1">
                        {productAddons.map(addon => (
                            <AddonCard
                                key={addon.id}
                                addon={addon}
                                onAdded={() => router.refresh()}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* ── Описание и состав ─────────────────────────────────────────── */}
            <section className="px-[18px] pb-10">
                <h2 className="mb-1.5 mt-[14px] text-[16px] font-medium text-text/70">Описание</h2>
                <p className="m-0 text-[14px] leading-relaxed opacity-80 text-pretty">
                    {DESCRIPTION}
                </p>

                {!isAddon && composition && (
                    <>
                        <h2 className="mb-1.5 mt-[14px] text-[16px] font-medium text-text/70">
                            Состав
                        </h2>
                        <p className="m-0 text-[14px] leading-relaxed opacity-80">{composition}</p>
                    </>
                )}
            </section>

            {upsellOpen && upsellAddon && (
                <UpsellSheet
                    addon={upsellAddon}
                    pending={pending}
                    onAdd={addUpsell}
                    onSkip={() => setUpsellOpen(false)}
                />
            )}
        </>
    );
}

/** Карточка дополнения: 120×98, цена с золотым свечением и круглая кнопка «+». */
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
        <article className="flex h-[98px] w-[120px] shrink-0 flex-col rounded-md bg-surface p-2.5">
            <p className="line-clamp-3 text-[11.5px] leading-[1.3] text-text">{addon.name}</p>

            <div className="mt-auto flex items-center justify-between gap-1">
                <span
                    className="text-[12px] text-[#E5B84B]"
                    style={{ textShadow: '0 2px 10px rgba(229,184,75,.2)' }}
                >
                    +{formatAmount(addon.price)} ₽
                </span>
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={add}
                    disabled={pending || !addon.productVariantId}
                    aria-label={`Добавить: ${addon.name}`}
                    className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full
                        border border-accent text-[13px] leading-none text-accent disabled:is-disabled"
                >
                    +
                </button>
            </div>
        </article>
    );
}
