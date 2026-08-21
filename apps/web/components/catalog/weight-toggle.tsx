'use client';

/**
 * Переключатель веса из макета: пилюля-дорожка, по которой ездит круглая
 * золотая шайба. Активная сторона показывает вес внутри шайбы, неактивная —
 * только цифру приглушённым цветом.
 *
 * Шайба (44px) выше дорожки (36px) намеренно — так в макете.
 */
export function WeightToggle({
    value,
    onChange,
}: {
    value: '500' | '1000';
    onChange: (weight: '500' | '1000') => void;
}) {
    return (
        <div
            className="relative flex h-9 flex-1 rounded-full border border-divider bg-surface-2"
            role="radiogroup"
            aria-label="Вес"
        >
            {(['500', '1000'] as const).map(option => {
                const active = value === option;
                const label = option === '500' ? '0.5' : '1';

                return (
                    <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={option === '500' ? '0.5 кг' : '1 кг'}
                        onClick={() => onChange(option)}
                        className="relative flex flex-1 cursor-pointer items-center justify-center"
                    >
                        {active ? (
                            <span
                                aria-hidden="true"
                                className="pointer-events-none absolute left-1/2 top-1/2 z-[2] flex
                                    h-11 w-11 -translate-x-1/2 -translate-y-1/2 flex-col items-center
                                    justify-center rounded-full border-2 border-surface bg-accent
                                    text-bg shadow-[0_4px_14px_rgba(0,0,0,0.45)]"
                            >
                                <span className="text-[11px] font-bold leading-[1.15]">{label}</span>
                                <span className="text-[7.5px] font-medium leading-none opacity-70">
                                    кг
                                </span>
                            </span>
                        ) : (
                            <span className="pointer-events-none text-[11px] text-[#a5b8de]">
                                {label}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
