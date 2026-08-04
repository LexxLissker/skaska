'use client';

import { useEffect, useRef, useState } from 'react';

import { suggestAddresses, type DeliveryOptions, type DeliveryRunOption } from '@/app/actions/checkout';
import { formatPrice } from '@/lib/format';

interface Props {
    address: string;
    onAddressChange: (value: string) => void;
    onAddressSelect: (value: string) => void;
    options: DeliveryOptions | null;
    selectedRunId: string | null;
    onRunSelect: (run: DeliveryRunOption) => void;
    pending: boolean;
}

export function DeliverySection({
    address,
    onAddressChange,
    onAddressSelect,
    options,
    selectedRunId,
    onRunSelect,
    pending,
}: Props) {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [focused, setFocused] = useState(false);
    const [mode, setMode] = useState<'nearest' | 'choose'>('nearest');
    const selectedRef = useRef(false);

    useEffect(() => {
        // После выбора из списка подсказки не показываем — иначе они
        // перекрывают карточку зоны сразу после клика.
        if (selectedRef.current) {
            selectedRef.current = false;
            return;
        }
        if (address.trim().length < 2) {
            setSuggestions([]);
            return;
        }
        const timer = setTimeout(async () => setSuggestions(await suggestAddresses(address)), 200);
        return () => clearTimeout(timer);
    }, [address]);

    const zone = options?.zone ?? null;
    const runs = options?.runs ?? [];
    const nearestRun = runs[0] ?? null;
    const activeRun = runs.find(r => r.id === selectedRunId) ?? nearestRun;

    return (
        <section className="card mx-4 mt-4 p-4">
            <h2 className="pb-3 font-heading text-[17px] font-medium">Доставка</h2>

            <label className="block text-[12px] text-text/70" htmlFor="address">
                Улица и дом
            </label>
            <div className="relative">
                <input
                    id="address"
                    value={address}
                    onChange={e => onAddressChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 150)}
                    placeholder="Начните вводить адрес"
                    autoComplete="off"
                    className="mt-1 min-h-9 w-full rounded-md border border-divider bg-surface-2 px-3
                        text-sm placeholder:text-text/45 focus-visible:border-accent"
                />

                {focused && suggestions.length > 0 && (
                    <ul className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-md
                        border border-divider bg-surface-2 shadow-lg">
                        {suggestions.map(suggestion => (
                            <li key={suggestion}>
                                <button
                                    type="button"
                                    // mousedown срабатывает раньше blur — иначе список
                                    // закроется прежде, чем клик дойдёт до кнопки.
                                    onMouseDown={() => {
                                        selectedRef.current = true;
                                        setSuggestions([]);
                                        onAddressSelect(suggestion);
                                    }}
                                    className="block w-full px-3 py-2 text-left text-[13.5px]
                                        hover:bg-surface hover:text-accent"
                                >
                                    {suggestion}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* ── До выбора адреса ──────────────────────────────────────────── */}
            {!zone && (
                <div className="mt-3 rounded-md bg-surface-2 px-3 py-5 text-center text-[12.5px] leading-relaxed text-text/45">
                    {pending
                        ? 'Считаем доставку…'
                        : address.trim() && !options
                          ? 'Укажем стоимость и время после выбора адреса'
                          : options && !zone
                            ? 'По этому адресу пока не возим. Напишите нам — согласуем.'
                            : 'Укажем стоимость и время после выбора адреса'}
                </div>
            )}

            {/* ── Зона и рейс ───────────────────────────────────────────────── */}
            {zone && activeRun && (
                <div className="mt-3 rounded-md bg-surface-2 p-3">
                    <p className="text-[12px] text-text/55">
                        Зона «{zone.name}»{' '}
                        {mode === 'nearest' ? '· ближайший рейс' : '· выбранная дата'}
                    </p>
                    <p className="mt-0.5 font-heading text-[15px] font-medium">
                        {activeRun.label}, {activeRun.window}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between border-t border-divider pt-2.5">
                        <span className="text-[13px] text-text/70">Доставка</span>
                        <span
                            className={`font-heading text-[14px] ${zone.cost === 0 ? 'text-accent' : ''}`}
                        >
                            {zone.cost === 0 ? 'Бесплатно' : formatPrice(zone.cost)}
                        </span>
                    </div>

                    <p className="pt-1 text-[11.5px] text-text/45">
                        {zone.remainingForFree > 0
                            ? `До бесплатной доставки осталось ${formatPrice(zone.remainingForFree)}`
                            : 'Бесплатная доставка активна'}
                    </p>
                    <p className="pt-0.5 text-[11.5px] text-text/45">
                        Оформите заказ {activeRun.deadlineLabel}
                    </p>

                    {/* Переключатель «ближайший / другая дата» */}
                    <div className="mt-3 inline-flex overflow-hidden rounded-md border border-divider">
                        {(['nearest', 'choose'] as const).map(value => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => {
                                    setMode(value);
                                    if (value === 'nearest' && nearestRun) onRunSelect(nearestRun);
                                }}
                                aria-pressed={mode === value}
                                className={`px-3 py-1.5 text-[12.5px] transition-colors
                                    ${mode === value ? 'text-accent shadow-[inset_0_0_0_1px_var(--color-accent)]' : 'text-text/60'}`}
                            >
                                {value === 'nearest' ? 'Ближайший рейс' : 'Другая дата'}
                            </button>
                        ))}
                    </div>

                    {mode === 'choose' && (
                        <div className="noscroll mt-2.5 flex gap-2 overflow-x-auto">
                            {runs.map(run => (
                                <button
                                    key={run.id}
                                    type="button"
                                    onClick={() => onRunSelect(run)}
                                    aria-pressed={run.id === activeRun.id}
                                    className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5
                                        font-heading text-[12.5px] transition-colors
                                        ${
                                            run.id === activeRun.id
                                                ? 'chip-active bg-surface text-accent'
                                                : 'border-divider text-text/65'
                                        }`}
                                >
                                    {run.shortLabel}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
