'use client';

import { formatAmount } from '@/lib/format';

/**
 * Шторка «Шеф рекомендует» — открывается после добавления товара в корзину,
 * если для его категории есть подходящие дополнения, и предлагает первое.
 */
export function UpsellSheet({
    addon,
    pending,
    onAdd,
    onSkip,
}: {
    addon: { id: string; name: string; price: number };
    pending: boolean;
    onAdd: () => void;
    onSkip: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center lg:p-6">
            <button
                type="button"
                aria-label="Пропустить"
                onClick={onSkip}
                className="absolute inset-0 bg-black/60"
            />

            <div className="relative w-full max-w-[412px] rounded-t-[20px] bg-surface px-[18px] pb-[22px] pt-5
                lg:max-w-[480px] lg:rounded-[20px] lg:border lg:border-divider lg:p-7">
                <div
                    aria-hidden="true"
                    className="mx-auto mb-4 h-1 w-9 rounded-sm bg-divider"
                />

                <p className="mb-1.5 text-[13px] text-accent-300">Шеф рекомендует</p>
                <p className="mb-4 text-[16px] text-text text-pretty">
                    Добавить к заказу {addon.name}?
                </p>

                <div className="flex gap-2.5">
                    <button
                        type="button"
                        onClick={onSkip}
                        className="btn btn-secondary h-11 flex-1"
                    >
                        Пропустить
                    </button>
                    <button
                        type="button"
                        onClick={onAdd}
                        disabled={pending}
                        className="btn btn-primary h-11 flex-1 disabled:is-disabled"
                    >
                        Да, за {formatAmount(addon.price)} ₽
                    </button>
                </div>
            </div>
        </div>
    );
}
