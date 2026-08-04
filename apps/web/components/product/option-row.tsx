'use client';

import type { OptionGroup } from '@/lib/api/catalog';

/**
 * Ряд пилюль одной группы опций с подсказкой под ним.
 *
 * Подсказка показывается для выбранного варианта — в макете она объясняет,
 * что даёт этот выбор («+50 ₽ — больше белка, меньше глютена»), и меняется
 * при переключении.
 */
export function OptionRow({
    group,
    value,
    onChange,
}: {
    group: OptionGroup;
    value: string;
    onChange: (choiceId: string) => void;
}) {
    const selected = group.choices.find(c => c.id === value) ?? group.choices[0];

    return (
        <section className="pt-4">
            <h3 className="px-4 pb-2 text-[13px] text-text/70">{group.label}</h3>

            <div
                className="noscroll flex gap-2 overflow-x-auto px-4"
                role="radiogroup"
                aria-label={group.label}
            >
                {group.choices.map(choice => {
                    const active = choice.id === selected.id;
                    return (
                        <button
                            key={choice.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => onChange(choice.id)}
                            className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5
                                font-heading text-[13px] transition-colors
                                ${
                                    active
                                        ? 'chip-active bg-surface-2 text-accent'
                                        : 'border-divider text-text/70 hover:text-text'
                                }`}
                        >
                            {choice.label}
                        </button>
                    );
                })}
            </div>

            <p className="px-4 pt-2 text-[12px] leading-relaxed text-text/50">{selected.hint}</p>
        </section>
    );
}
