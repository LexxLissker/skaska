import { LanguageCode, PluginCommonModule, VendurePlugin } from '@vendure/core';

import { OPTION_GROUPS, OptionGroupCode, DEFAULT_OPTIONS } from '../../data/catalog-data';
import { shopApiExtensions } from './api/api-extensions';
import { ConfiguratorResolver } from './api/configurator.resolver';
import { ConfiguratorPriceCalculationStrategy } from './configurator-price-strategy';

/**
 * Конфигуратор товара: тесто, сочность/жир, цвет теста, текстура фарша.
 *
 * Опции хранятся как custom fields на OrderLine, а не как варианты товара —
 * подробнее о причине в `configurator-price-strategy.ts`. Благодаря этому две
 * позиции одного товара с разной конфигурацией остаются разными строками
 * заказа: Vendure сравнивает строки в том числе по custom fields.
 */
@VendurePlugin({
    imports: [PluginCommonModule],
    shopApiExtensions: {
        schema: shopApiExtensions,
        resolvers: [ConfiguratorResolver],
    },
    configuration: config => {
        // Наценки за опции считаются на сервере.
        config.orderOptions.orderItemPriceCalculationStrategy =
            new ConfiguratorPriceCalculationStrategy();

        // Каталогу нужен код категории: по нему резолвятся базовые БЖУ
        // и набор релевантных дополнений.
        config.customFields.Product.push(
            {
                name: 'categoryCode',
                type: 'string',
                nullable: true,
                label: [{ languageCode: LanguageCode.ru, value: 'Код категории' }],
                description: [
                    {
                        languageCode: LanguageCode.ru,
                        value: 'Технический код категории (pelmeni, vareniki …). Определяет БЖУ и набор дополнений.',
                    },
                ],
            },
            {
                name: 'filling',
                type: 'string',
                nullable: true,
                label: [{ languageCode: LanguageCode.ru, value: 'Начинка' }],
            },
        );

        // Группы опций конфигуратора на позиции заказа.
        for (const code of Object.keys(OPTION_GROUPS) as OptionGroupCode[]) {
            const group = OPTION_GROUPS[code];
            config.customFields.OrderLine.push({
                name: group.code,
                type: 'string',
                nullable: true,
                defaultValue: DEFAULT_OPTIONS[code],
                options: group.choices.map(choice => ({
                    value: choice.id,
                    label: [{ languageCode: LanguageCode.ru, value: choice.label }],
                })),
                label: [{ languageCode: LanguageCode.ru, value: group.label }],
            });
        }

        return config;
    },
    compatibility: '^3.0.0',
})
export class ProductConfiguratorPlugin {}
