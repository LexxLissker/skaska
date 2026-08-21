'use client';

import { useEffect, useRef, useState } from 'react';

import {
    suggestAddresses,
    type DeliveryOptions,
    type DeliveryRunOption,
} from '@/app/actions/checkout';
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
    const justPicked = useRef(false);

    useEffect(() => {
        // После выбора из списка подсказки не показываем — иначе они
        // перекрывают карточку зоны сразу после клика.
        if (justPicked.current) {
            justPicked.current = false;
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
    const activeRun = runs.find(r => r.id === selectedRunId) ?? runs[0] ?? null;

    return (
        <section className="panel p-4">
            <p className="mb-3 text-[15px] font-medium text-text">Доставка</p>

            <div className="field relative mb-3">
                <label htmlFor="address">Улица и дом</label>
                <input
                    id="address"
                    className="input"
                    placeholder="Например, ул. Тверская, 12"
                    autoComplete="off"
                    value={address}
                    onChange={e => onAddressChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 150)}
                />

                {focused && suggestions.length > 0 && (
                    <div
                        className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-md
                            border border-divider bg-surface-2 shadow-[var(--shadow-md)]"
                    >
                        {suggestions.map(suggestion => (
                            <button
                                key={suggestion}
                                type="button"
                                // mousedown срабатывает раньше blur — иначе список
                                // закроется прежде, чем клик дойдёт до кнопки.
                                onMouseDown={() => {
                                    justPicked.current = true;
                                    setSuggestions([]);
                                    onAddressSelect(suggestion);
                                }}
                                className="block w-full border-b border-divider px-3 py-[11px] text-left
                                    text-[13.5px] text-text last:border-0 hover:bg-surface"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {zone && activeRun ? (
                <>
                    <div className="mb-3 flex flex-col gap-[7px] rounded-md bg-surface-2 px-3.5 py-3">
                        <p className="text-[12px] text-text/60">
                            Зона «{zone.name}» ·{' '}
                            {mode === 'nearest' ? 'ближайший рейс' : 'выбранная дата'}
                        </p>
                        <p className="text-[13.5px] font-medium text-text">
                            {activeRun.label} · {activeRun.window}
                        </p>

                        <div className="flex items-center justify-between text-[13px] text-text/70">
                            <span>Доставка</span>
                            <span className={zone.cost === 0 ? 'font-medium text-accent' : 'text-text'}>
                                {zone.cost === 0 ? 'Бесплатно' : formatPrice(zone.cost)}
                            </span>
                        </div>

                        <p className="text-[12px] text-accent-300">
                            {zone.remainingForFree > 0
                                ? `До бесплатной доставки осталось ${formatPrice(zone.remainingForFree)}`
                                : 'Бесплатная доставка активна'}
                        </p>
                        <p className="text-[11.5px] text-text/50">
                            Оформите заказ {activeRun.deadlineLabel}
                        </p>
                    </div>

                    <div className="seg">
                        {(['nearest', 'choose'] as const).map(value => (
                            <label key={value} className="seg-opt">
                                <input
                                    type="radio"
                                    name="timemode"
                                    checked={mode === value}
                                    onChange={() => {
                                        setMode(value);
                                        if (value === 'nearest' && runs[0]) onRunSelect(runs[0]);
                                    }}
                                />
                                <span>{value === 'nearest' ? 'Ближайший рейс' : 'Другая дата'}</span>
                            </label>
                        ))}
                    </div>

                    {mode === 'choose' && (
                        <div className="mt-2.5 flex flex-wrap gap-2">
                            {runs.map(run => {
                                const active = run.id === activeRun.id;
                                return (
                                    <button
                                        key={run.id}
                                        type="button"
                                        onClick={() => onRunSelect(run)}
                                        aria-pressed={active}
                                        className={`whitespace-nowrap rounded-full border px-[11px] py-1.5
                                            text-[12.5px] font-medium
                                            ${
                                                active
                                                    ? 'border-accent bg-surface-2 text-accent shadow-[0_0_12px_rgba(229,184,75,0.18)]'
                                                    : 'border-divider bg-transparent text-[#a5b8de]'
                                            }`}
                                    >
                                        {run.shortLabel}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </>
            ) : (
                <div className="rounded-md bg-surface-2 p-3.5 text-center text-[13px] text-text/60">
                    {pending
                        ? 'Считаем доставку…'
                        : options && !zone
                          ? 'По этому адресу пока не возим. Напишите нам — согласуем.'
                          : 'Укажем стоимость и время после выбора адреса'}
                </div>
            )}
        </section>
    );
}
