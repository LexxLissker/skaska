import { Args, Query, Resolver } from '@nestjs/graphql';
import { Ctx, ID, ProductService, ProductVariantService, RequestContext } from '@vendure/core';

import {
    BASE_BJU,
    ADDONS,
    getRelevantAddonIds,
    OPTION_GROUPS,
    OptionGroupCode,
    toMinorUnits,
} from '../../../data/catalog-data';

@Resolver()
export class ConfiguratorResolver {
    constructor(
        private productService: ProductService,
        private productVariantService: ProductVariantService,
    ) {}

    @Query()
    async productConfigurator(
        @Ctx() ctx: RequestContext,
        @Args() args: { productId?: ID },
    ) {
        const groups = (Object.keys(OPTION_GROUPS) as OptionGroupCode[]).map(code => {
            const group = OPTION_GROUPS[code];
            return {
                code: group.code,
                label: group.label,
                choices: group.choices.map(choice => ({
                    id: choice.id,
                    label: choice.label,
                    delta: toMinorUnits(choice.delta),
                    hint: choice.hint,
                    bju: {
                        protein: choice.bju.p,
                        fat: choice.bju.f,
                        carbs: choice.bju.c,
                        kcal: choice.bju.k,
                    },
                })),
            };
        });

        if (!args.productId) {
            return { groups, baseBju: null, addons: [] };
        }

        const product = await this.productService.findOne(ctx, args.productId);
        const categoryCode = (product?.customFields as any)?.categoryCode ?? '';
        const productName = product?.name ?? '';

        const base = BASE_BJU[categoryCode];
        const addonIds = getRelevantAddonIds(categoryCode, productName);

        // Дополнения — обычные товары «Гастролавки». Отдаём вместе с id варианта,
        // чтобы витрина могла добавить их в корзину одним запросом.
        const addonVariants = await this.findAddonVariants(ctx, addonIds);

        return {
            groups,
            baseBju: base
                ? { protein: base.p, fat: base.f, carbs: base.c, kcal: base.k }
                : null,
            addons: addonIds
                .map(id => {
                    const def = ADDONS.find(a => a.id === id);
                    if (!def) return null;
                    return {
                        id: def.id,
                        name: def.name,
                        price: toMinorUnits(def.price),
                        productVariantId: addonVariants.get(id) ?? null,
                    };
                })
                .filter(Boolean),
        };
    }

    /** Сопоставляет коды дополнений с id их вариантов по артикулу `addon-<id>`. */
    private async findAddonVariants(ctx: RequestContext, addonIds: string[]): Promise<Map<string, ID>> {
        const result = new Map<string, ID>();
        if (!addonIds.length) return result;

        const skus = addonIds.map(id => `addon-${id}`);
        const { items } = await this.productVariantService.findAll(ctx, {
            filter: { sku: { in: skus } },
            take: skus.length,
        });

        for (const variant of items) {
            const addonId = variant.sku.replace(/^addon-/, '');
            result.set(addonId, variant.id);
        }
        return result;
    }
}
