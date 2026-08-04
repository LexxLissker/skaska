import { INestApplicationContext } from '@nestjs/common';
import {
    ChannelService,
    CountryService,
    LanguageCode,
    PaymentMethodService,
    PromotionService,
    RequestContext,
    ShippingMethodService,
    TaxCategoryService,
    TaxRateService,
    ZoneService,
} from '@vendure/core';

import { PROMO_CODES, toMinorUnits } from '../data/catalog-data';

/**
 * Базовая коммерческая настройка: страна, налоговая зона, ставка НДС,
 * способ доставки на нашем плагине, способ оплаты и промокоды.
 */
export async function seedCommerce(app: INestApplicationContext, ctx: RequestContext): Promise<void> {
    const countryService = app.get(CountryService);
    const zoneService = app.get(ZoneService);
    const taxCategoryService = app.get(TaxCategoryService);
    const taxRateService = app.get(TaxRateService);
    const channelService = app.get(ChannelService);
    const shippingMethodService = app.get(ShippingMethodService);
    const paymentMethodService = app.get(PaymentMethodService);
    const promotionService = app.get(PromotionService);

    // ─── Страна и зона ────────────────────────────────────────────────────────
    const existingCountries = await countryService.findAll(ctx, { filter: { code: { eq: 'RU' } } });
    const country =
        existingCountries.items[0] ??
        (await countryService.create(ctx, {
            code: 'RU',
            enabled: true,
            translations: [{ languageCode: LanguageCode.ru, name: 'Россия' }],
        }));

    const existingZones = await zoneService.findAll(ctx, { filter: { name: { eq: 'Россия' } } });
    const zone =
        existingZones.items[0] ??
        (await zoneService.create(ctx, { name: 'Россия', memberIds: [country.id] }));

    // ─── Налоги ───────────────────────────────────────────────────────────────
    // Ставка 0%: небольшое производство почти наверняка на УСН и НДС не платит,
    // а цены в макетах — это ровно то, что платит покупатель.
    // Если магазин окажется на ОСНО, здесь ставится 10% (продукты питания)
    // при том же `pricesIncludeTax: true` — итоговые цены не изменятся.
    const taxCategories = await taxCategoryService.findAll(ctx, {});
    const taxCategory =
        taxCategories.items.find(c => c.name === 'Без НДС') ??
        (await taxCategoryService.create(ctx, { name: 'Без НДС', isDefault: true }));

    const taxRates = await taxRateService.findAll(ctx, {});
    if (!taxRates.items.some(r => r.name === 'Россия — без НДС')) {
        await taxRateService.create(ctx, {
            name: 'Россия — без НДС',
            enabled: true,
            value: 0,
            categoryId: taxCategory.id,
            zoneId: zone.id,
        });
    }

    const defaultChannel = await channelService.getDefaultChannel(ctx);
    await channelService.update(ctx, {
        id: defaultChannel.id,
        defaultTaxZoneId: zone.id,
        defaultShippingZoneId: zone.id,
        pricesIncludeTax: true,
        defaultLanguageCode: LanguageCode.ru,
        availableLanguageCodes: [LanguageCode.ru, LanguageCode.en],
    });

    // ─── Доставка ─────────────────────────────────────────────────────────────
    // Один метод на все зоны: стоимость и доступность считает наш плагин,
    // опираясь на зону конкретного адреса.
    const shippingMethods = await shippingMethodService.findAll(ctx, {});
    if (!shippingMethods.items.some(m => m.code === 'scheduled-delivery')) {
        await shippingMethodService.create(ctx, {
            code: 'scheduled-delivery',
            checker: { code: 'scheduled-delivery-checker', arguments: [] },
            calculator: { code: 'scheduled-delivery-calculator', arguments: [] },
            fulfillmentHandler: 'manual-fulfillment',
            translations: [
                {
                    languageCode: LanguageCode.ru,
                    name: 'Доставка по расписанию',
                    description: 'Привозим в термосумке в день ближайшего рейса по вашей зоне.',
                },
            ],
        });
    }

    // ─── Оплата ───────────────────────────────────────────────────────────────
    const paymentMethods = await paymentMethodService.findAll(ctx, {});
    if (!paymentMethods.items.some(m => m.code === 'sbp')) {
        await paymentMethodService.create(ctx, {
            code: 'sbp',
            enabled: true,
            handler: { code: 'mock-sbp', arguments: [] },
            translations: [
                {
                    languageCode: LanguageCode.ru,
                    name: 'СБП',
                    description: 'Оплата через Систему быстрых платежей.',
                },
            ],
        });
    }

    // ─── Промокоды ────────────────────────────────────────────────────────────
    // Штатные промоакции Vendure с купоном — свой код для этого не нужен.
    const promotions = await promotionService.findAll(ctx, {});
    for (const promo of PROMO_CODES) {
        if (promotions.items.some(p => p.couponCode === promo.code)) continue;

        const action =
            promo.type === 'percent'
                ? {
                      code: 'order_percentage_discount',
                      arguments: [{ name: 'discount', value: String(promo.value) }],
                  }
                : {
                      code: 'order_fixed_discount',
                      arguments: [{ name: 'discount', value: String(toMinorUnits(promo.value)) }],
                  };

        await promotionService.createPromotion(ctx, {
            enabled: true,
            couponCode: promo.code,
            conditions: [],
            actions: [action],
            translations: [{ languageCode: LanguageCode.ru, name: promo.name, description: '' }],
        });
    }

    console.log('  ✓ страна, зона, налоги, доставка, оплата, промокоды');
}
