'use client';

import type { OptionGroup } from '@/lib/api/catalog';

/**
 * Ряд пилюль одной группы опций с подсказкой под ним.
 * Размеры и состояния сняты с прототипа: 12.5px/500, активная —
 * акцентная рамка на surface-2 с мягким свечением.
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
        <section className="px-[18px] pb-4 lg:px-7 lg:pb-5">
            <div className="mb-2 text-[15px] font-medium text-text lg:text-[16px]">{group.label}</div>

            <div
                className="noscroll -mx-[18px] flex gap-1.5 overflow-x-auto px-[18px] lg:mx-0 lg:flex-wrap lg:px-0"
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
                            className={`shrink-0 whitespace-nowrap rounded-full border px-[11px] py-1.5
                                text-[12.5px] font-medium transition-colors lg:px-[13px] lg:py-2 lg:text-[13px]
                                ${
                                    active
                                        ? 'chip-active bg-surface-2 text-accent'
                                        : 'border-divider bg-transparent text-[#a5b8de]'
                                }`}
                        >
                            {choice.label}
                        </button>
                    );
                })}
            </div>

            <p className="mt-2 text-[12px] leading-[1.4] opacity-70 lg:text-[13px]">{selected.hint}</p>
        </section>
    );
}
