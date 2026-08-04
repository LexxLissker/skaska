import {
    Order,
    OrderItemPriceCalculationStrategy,
    PriceCalculationResult,
    ProductVariant,
    RequestContext,
} from '@vendure/core';

import { OPTION_GROUPS, OptionGroupCode, toMinorUnits } from '../../data/catalog-data';

/**
 * Считает цену позиции заказа с учётом выбранной конфигурации товара.
 *
 * Почему так, а не через варианты Vendure: в прототипе пять групп опций —
 * вес (2) × тесто (6) × жир (4) × цвет (4) × текстура (2). Как ProductVariant это
 * дало бы 384 варианта на товар и ~37 000 на каталог. Поэтому вариантами
 * остаётся только вес, а остальные четыре группы живут как custom fields
 * на OrderLine, и наценка за них применяется здесь.
 *
 * Ключевое свойство: цена считается на сервере из справочника наценок, а не
 * приходит с витрины. Подделать её запросом нельзя.
 */
export class ConfiguratorPriceCalculationStrategy implements OrderItemPriceCalculationStrategy {
    calculateUnitPrice(
        _ctx: RequestContext,
        productVariant: ProductVariant,
        orderLineCustomFields: { [key: string]: any },
        _order: Order,
        _quantity: number,
    ): PriceCalculationResult {
        return {
            price: productVariant.listPrice + this.surchargeFor(orderLineCustomFields),
            priceIncludesTax: productVariant.listPriceIncludesTax,
        };
    }

    /**
     * Сумма наценок за выбранные опции, в копейках.
     * Неизвестные значения игнорируются — заказ не должен падать
     * из-за опции, которую убрали из справочника.
     */
    private surchargeFor(customFields: { [key: string]: any }): number {
        let total = 0;
        for (const code of Object.keys(OPTION_GROUPS) as OptionGroupCode[]) {
            const selectedId = customFields?.[code];
            if (!selectedId) continue;
            const choice = OPTION_GROUPS[code].choices.find(c => c.id === selectedId);
            if (choice) {
                total += toMinorUnits(choice.delta);
            }
        }
        return total;
    }
}
