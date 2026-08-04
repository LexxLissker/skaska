import {
    CreatePaymentResult,
    LanguageCode,
    PaymentMethodHandler,
    SettlePaymentResult,
} from '@vendure/core';

/**
 * Заглушка оплаты по СБП.
 *
 * Повторяет сценарий из прототипа: покупатель жмёт «Оплатить», видит шторку
 * «Переходим в банковское приложение», платёж сразу авторизуется и списывается.
 * Никакого обращения к банку здесь нет.
 *
 * Это точка подмены на реальную интеграцию (ЮKassa / SBP SDK): меняется только
 * этот handler — `createPayment` должен возвращать состояние `Authorized` вместе
 * со ссылкой на оплату в metadata, а подтверждение приходить вебхуком.
 */
export const mockSbpPaymentHandler = new PaymentMethodHandler({
    code: 'mock-sbp',
    description: [
        { languageCode: LanguageCode.ru, value: 'СБП (заглушка для разработки)' },
        { languageCode: LanguageCode.en, value: 'SBP (development mock)' },
    ],
    args: {},

    createPayment: async (ctx, order, amount, _args, metadata): Promise<CreatePaymentResult> => {
        return {
            amount,
            state: 'Settled',
            transactionId: `mock-sbp-${order.code}-${Date.now()}`,
            metadata: {
                ...metadata,
                mock: true,
                note: 'Платёж проведён заглушкой. Реальных денежных операций не было.',
            },
        };
    },

    settlePayment: async (): Promise<SettlePaymentResult> => {
        return { success: true };
    },
});
