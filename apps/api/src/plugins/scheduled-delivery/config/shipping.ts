import {
    LanguageCode,
    Order,
    RequestContext,
    ShippingCalculator,
    ShippingEligibilityChecker,
} from '@vendure/core';

import { formatDeadline, formatRunLong } from '../../../data/delivery-data';
import { DeliveryService } from '../services/delivery.service';

let deliveryService: DeliveryService;

/** Адрес доставки заказа одной строкой — по нему определяется зона. */
function addressOf(order: Order): string {
    return order.shippingAddress?.streetLine1?.trim() ?? '';
}

/**
 * Заказ доставляем, только если адрес попадает в одну из зон.
 * Если адрес вне зон — метод доставки просто не предлагается,
 * и покупатель видит это до оплаты, а не после.
 */
export const scheduledDeliveryEligibilityChecker = new ShippingEligibilityChecker({
    code: 'scheduled-delivery-checker',
    description: [
        { languageCode: LanguageCode.ru, value: 'Адрес входит в зону плановой доставки' },
        { languageCode: LanguageCode.en, value: 'Address is within a scheduled delivery zone' },
    ],
    args: {},
    init(injector) {
        deliveryService = injector.get(DeliveryService);
    },
    check: async (ctx: RequestContext, order: Order) => {
        const address = addressOf(order);
        if (!address) return false;

        const zone = await deliveryService.findZoneByAddress(ctx, address);
        if (!zone) return false;

        // Зона без доступных рейсов (все дедлайны прошли) тоже неприемлема.
        const runs = await deliveryService.ensureUpcomingRuns(ctx, zone);
        return runs.length > 0;
    },
});

/**
 * Стоимость доставки берётся из зоны и обнуляется при достижении её порога.
 * Порог у каждой зоны свой — единой суммы «бесплатно от N ₽» в этой модели нет.
 *
 * В metadata кладём данные ближайшего рейса: витрине они нужны, чтобы показать
 * дату, интервал и дедлайн, не запрашивая их отдельно.
 */
export const scheduledDeliveryCalculator = new ShippingCalculator({
    code: 'scheduled-delivery-calculator',
    description: [
        { languageCode: LanguageCode.ru, value: 'Стоимость по зоне с порогом бесплатной доставки' },
        { languageCode: LanguageCode.en, value: 'Zone-based cost with free-delivery threshold' },
    ],
    args: {},
    init(injector) {
        deliveryService = injector.get(DeliveryService);
    },
    calculate: async (ctx: RequestContext, order: Order) => {
        const resolved = await deliveryService.resolveForAddress(
            ctx,
            addressOf(order),
            order.subTotalWithTax,
        );
        if (!resolved) return undefined;

        const { zone, runs, cost, remainingForFree } = resolved;
        const nextRun = runs[0];

        return {
            price: cost,
            priceIncludesTax: ctx.channel.pricesIncludeTax,
            taxRate: 0,
            metadata: {
                zoneCode: zone.code,
                zoneName: zone.name,
                window: zone.window,
                freeThreshold: zone.freeThreshold,
                remainingForFree,
                nextRunId: nextRun ? String(nextRun.id) : null,
                nextRunDate: nextRun ? nextRun.date.toISOString() : null,
                nextRunLabel: nextRun ? formatRunLong(nextRun.date) : null,
                nextRunDeadline: nextRun ? formatDeadline(nextRun.deadline) : null,
            },
        };
    },
});
