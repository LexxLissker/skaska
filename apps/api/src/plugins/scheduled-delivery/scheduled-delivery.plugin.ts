import { LanguageCode, PluginCommonModule, VendurePlugin } from '@vendure/core';

import { shopApiExtensions } from './api/api-extensions';
import { DeliveryResolver } from './api/delivery.resolver';
import { scheduledDeliveryCalculator, scheduledDeliveryEligibilityChecker } from './config/shipping';
import { DeliveryRun } from './entities/delivery-run.entity';
import { DeliveryZone } from './entities/delivery-zone.entity';
import { TableAddressLookupStrategy } from './services/address-lookup.strategy';
import { DeliveryService } from './services/delivery.service';

export interface ScheduledDeliveryPluginOptions {
    /**
     * Как определяется зона по адресу.
     * `table` — таблица соответствий (MVP). Позже здесь появится `dadata`/`yandex`.
     */
    addressLookup: 'table';
}

/**
 * Плановая доставка по зонам.
 *
 * Модель отличается от привычной доставки «по требованию»: у каждой зоны своё
 * расписание рейсов, своя стоимость и свой порог бесплатной доставки. Покупатель
 * выбирает не «когда угодно», а конкретный ближайший рейс, и успеть оформить
 * заказ нужно до дедлайна приёма.
 *
 * Расчёт стоимости живёт в ShippingCalculator, то есть внутри Vendure —
 * витрина только отображает то, что посчитал сервер.
 */
@VendurePlugin({
    imports: [PluginCommonModule],
    entities: [DeliveryZone, DeliveryRun],
    providers: [DeliveryService, TableAddressLookupStrategy],
    exports: [DeliveryService],
    shopApiExtensions: {
        schema: shopApiExtensions,
        resolvers: [DeliveryResolver],
    },
    configuration: config => {
        config.shippingOptions.shippingEligibilityCheckers.push(scheduledDeliveryEligibilityChecker);
        config.shippingOptions.shippingCalculators.push(scheduledDeliveryCalculator);

        // Что именно везём и когда — фиксируем на заказе, чтобы это попало
        // в админку, в письма и в маршрутный лист курьера.
        config.customFields.Order.push(
            {
                name: 'deliveryZoneCode',
                type: 'string',
                nullable: true,
                label: [{ languageCode: LanguageCode.ru, value: 'Зона доставки' }],
            },
            {
                name: 'deliveryRunId',
                type: 'string',
                nullable: true,
                label: [{ languageCode: LanguageCode.ru, value: 'Рейс' }],
            },
            {
                name: 'deliveryDate',
                type: 'datetime',
                nullable: true,
                label: [{ languageCode: LanguageCode.ru, value: 'Дата доставки' }],
            },
            {
                name: 'deliveryWindow',
                type: 'string',
                nullable: true,
                label: [{ languageCode: LanguageCode.ru, value: 'Интервал доставки' }],
            },
            {
                name: 'deliveryComment',
                type: 'text',
                nullable: true,
                label: [{ languageCode: LanguageCode.ru, value: 'Комментарий к доставке' }],
            },
        );

        return config;
    },
    compatibility: '^3.0.0',
})
export class ScheduledDeliveryPlugin {
    static options: ScheduledDeliveryPluginOptions = { addressLookup: 'table' };

    static init(options: ScheduledDeliveryPluginOptions): typeof ScheduledDeliveryPlugin {
        this.options = options;
        return ScheduledDeliveryPlugin;
    }
}
