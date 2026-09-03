'use client';

import { useState } from 'react';

import { formatPrice } from '@/lib/format';

/**
 * Шторка оплаты.
 *
 * Оба сценария — заглушки под реальную интеграцию: СБП вместо этого экрана
 * будет уводить в банковское приложение по диплинку, карта — открывать форму
 * эквайера в iframe. Реквизиты карты здесь никуда не отправляются и нигде
 * не сохраняются: поля оставлены, чтобы сохранить сценарий из макета.
 */
export function PaymentSheet({
    method,
    amount,
    pending,
    onConfirm,
    onCancel,
}: {
    method: 'sbp' | 'card';
    amount: number;
    pending: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const [card, setCard] = useState({ number: '', expiry: '', cvc: '' });

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center lg:p-6">
            <button
                type="button"
                aria-label="Отмена"
                onClick={onCancel}
                className="absolute inset-0 bg-black/60"
            />

            <div className="relative w-full max-w-[412px] rounded-t-[16px] border-t border-divider bg-surface px-4 pb-8 pt-5
                lg:max-w-[500px] lg:rounded-[18px] lg:border lg:p-7 lg:shadow-[0_24px_80px_rgba(0,0,0,.6)]">
                <p className="mb-1 rounded-md bg-surface-2 px-3 py-2 text-[11.5px] leading-relaxed text-text/50">
                    Демо-режим: платёжный провайдер ещё не подключён, деньги не списываются.
                </p>

                {method === 'sbp' ? (
                    <>
                        <h2 className="pt-3 font-heading text-[19px] font-medium">
                            Переходим в банковское приложение
                        </h2>
                        <p className="pt-1.5 text-[13px] text-text/60">
                            Подтвердите оплату {formatPrice(amount)} в приложении вашего банка.
                        </p>
                    </>
                ) : (
                    <>
                        <h2 className="pt-3 font-heading text-[19px] font-medium">Оплата картой</h2>
                        <div className="mt-3 flex flex-col gap-2">
                            <input
                                inputMode="numeric"
                                autoComplete="off"
                                value={card.number}
                                onChange={e => setCard({ ...card, number: e.target.value })}
                                placeholder="Номер карты"
                                aria-label="Номер карты"
                                className="min-h-9 rounded-md border border-divider bg-surface-2 px-3
                                    text-sm placeholder:text-text/45 focus-visible:border-accent"
                            />
                            <div className="flex gap-2">
                                <input
                                    inputMode="numeric"
                                    autoComplete="off"
                                    value={card.expiry}
                                    onChange={e => setCard({ ...card, expiry: e.target.value })}
                                    placeholder="ММ/ГГ"
                                    aria-label="Срок действия"
                                    className="min-h-9 w-full rounded-md border border-divider bg-surface-2
                                        px-3 text-sm placeholder:text-text/45 focus-visible:border-accent"
                                />
                                <input
                                    inputMode="numeric"
                                    autoComplete="off"
                                    value={card.cvc}
                                    onChange={e => setCard({ ...card, cvc: e.target.value })}
                                    placeholder="CVC"
                                    aria-label="Код проверки"
                                    className="min-h-9 w-full rounded-md border border-divider bg-surface-2
                                        px-3 text-sm placeholder:text-text/45 focus-visible:border-accent"
                                />
                            </div>
                        </div>
                    </>
                )}

                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={pending}
                    className="btn-gradient mt-4 w-full rounded-md py-3 font-heading text-[15px]
                        font-semibold disabled:is-disabled"
                >
                    {pending ? 'Проводим…' : `Оплатить ${formatPrice(amount)}`}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="mt-2 w-full py-2 text-[13.5px] text-text/55 hover:text-accent"
                >
                    Отмена
                </button>
            </div>
        </div>
    );
}
