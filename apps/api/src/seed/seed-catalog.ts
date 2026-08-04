import { INestApplicationContext } from '@nestjs/common';
import { GlobalFlag } from '@vendure/common/lib/generated-types';
import {
    CollectionService,
    FacetService,
    FacetValueService,
    ID,
    LanguageCode,
    ProductOptionGroupService,
    ProductOptionService,
    ProductService,
    ProductVariantService,
    RequestContext,
    TaxCategoryService,
} from '@vendure/core';

import {
    ADDON_CATEGORY_ID,
    ADDON_SUBCATEGORY,
    ADDONS,
    buildProducts,
    buildSubDescription,
    CATEGORIES,
    FILLINGS,
    toMinorUnits,
    WEIGHT_OPTIONS,
} from '../data/catalog-data';

/** Латинизация для slug-ов: Vendure требует уникальный ASCII-slug. */
function slugify(input: string): string {
    const map: Record<string, string> = {
        а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
        й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
        у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
        э: 'e', ю: 'yu', я: 'ya',
    };
    return input
        .toLowerCase()
        .split('')
        .map(ch => map[ch] ?? ch)
        .join('')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

interface FacetValueRefs {
    category: Map<string, ID>;
    /** Ключ — `${categoryId}:${subIndex}`. */
    subcategory: Map<string, ID>;
    filling: Map<string, ID>;
}

export async function seedCatalog(app: INestApplicationContext, ctx: RequestContext): Promise<void> {
    const facetService = app.get(FacetService);
    const facetValueService = app.get(FacetValueService);
    const collectionService = app.get(CollectionService);
    const productService = app.get(ProductService);
    const productVariantService = app.get(ProductVariantService);
    const optionGroupService = app.get(ProductOptionGroupService);
    const optionService = app.get(ProductOptionService);
    const taxCategoryService = app.get(TaxCategoryService);

    const taxCategories = await taxCategoryService.findAll(ctx, {});
    const taxCategoryId = taxCategories.items[0].id;

    const refs = await seedFacets(ctx, facetService, facetValueService);
    await seedCollections(ctx, collectionService, refs);

    // ─── Товары категорий ─────────────────────────────────────────────────────
    const products = buildProducts();
    let created = 0;

    for (const def of products) {
        const category = CATEGORIES.find(c => c.id === def.categoryId)!;
        // Начинки в прототипе одинаковы для всех категорий и не привязаны к
        // подкатегориям, поэтому раскладываем их по кругу. Это заглушка:
        // реальную раскладку задаёт владелец каталога в админке.
        const subIndex = FILLINGS.indexOf(def.filling as any) % category.subs.length;

        const facetValueIds = [
            refs.category.get(def.categoryId),
            refs.subcategory.get(`${def.categoryId}:${subIndex}`),
            refs.filling.get(def.filling),
        ].filter((id): id is ID => id != null);

        const product = await productService.create(ctx, {
            facetValueIds,
            translations: [
                {
                    languageCode: LanguageCode.ru,
                    name: def.name,
                    slug: def.slug,
                    description: category.desc,
                },
            ],
            customFields: { categoryCode: def.categoryId, filling: def.filling },
        });

        // Вариантами остаётся только вес — остальные опции живут
        // как custom fields на позиции заказа (см. ProductConfiguratorPlugin).
        const group = await optionGroupService.create(ctx, {
            code: `${def.slug}-weight`,
            translations: [{ languageCode: LanguageCode.ru, name: 'Вес' }],
        });

        const optionIds: Record<string, ID> = {};
        for (const weight of WEIGHT_OPTIONS) {
            const option = await optionService.create(ctx, group.id, {
                code: `${def.slug}-${weight.id}`,
                translations: [{ languageCode: LanguageCode.ru, name: weight.label }],
            });
            optionIds[weight.id] = option.id;
        }

        await productService.addOptionGroupToProduct(ctx, product.id, group.id);

        await productVariantService.create(ctx, [
            {
                productId: product.id,
                sku: `${def.slug}-500`,
                price: toMinorUnits(def.price500),
                taxCategoryId,
                optionIds: [optionIds['500']],
                stockOnHand: 100,
                trackInventory: GlobalFlag.FALSE,
                translations: [{ languageCode: LanguageCode.ru, name: `${def.name}, 0.5 кг` }],
            },
            {
                productId: product.id,
                sku: `${def.slug}-1000`,
                price: toMinorUnits(def.price1000),
                taxCategoryId,
                optionIds: [optionIds['1000']],
                stockOnHand: 100,
                trackInventory: GlobalFlag.FALSE,
                translations: [{ languageCode: LanguageCode.ru, name: `${def.name}, 1 кг` }],
            },
        ]);

        created++;
        if (created % 20 === 0) console.log(`    … ${created}/${products.length} товаров`);
    }

    // ─── Гастролавка: дополнения без опций ────────────────────────────────────
    for (const addon of ADDONS) {
        const subIndex = ADDON_SUBCATEGORY[addon.id] ?? 0;
        const facetValueIds = [
            refs.category.get(ADDON_CATEGORY_ID),
            refs.subcategory.get(`${ADDON_CATEGORY_ID}:${subIndex}`),
        ].filter((id): id is ID => id != null);

        const product = await productService.create(ctx, {
            facetValueIds,
            translations: [
                {
                    languageCode: LanguageCode.ru,
                    name: addon.name,
                    slug: slugify(addon.name),
                    description: 'Дополнение к основным блюдам из «Гастролавки».',
                },
            ],
            customFields: { categoryCode: ADDON_CATEGORY_ID, filling: null },
        });

        await productVariantService.create(ctx, [
            {
                productId: product.id,
                // Артикул `addon-<id>` — по нему конфигуратор находит вариант
                // для блока «С чем подать?».
                sku: `addon-${addon.id}`,
                price: toMinorUnits(addon.price),
                taxCategoryId,
                optionIds: [],
                stockOnHand: 100,
                trackInventory: GlobalFlag.FALSE,
                translations: [{ languageCode: LanguageCode.ru, name: addon.name }],
            },
        ]);
    }

    console.log(`  ✓ товаров: ${products.length} + ${ADDONS.length} дополнений`);
}

async function seedFacets(
    ctx: RequestContext,
    facetService: FacetService,
    facetValueService: FacetValueService,
): Promise<FacetValueRefs> {
    const refs: FacetValueRefs = { category: new Map(), subcategory: new Map(), filling: new Map() };

    const categoryFacet = await facetService.create(ctx, {
        code: 'category',
        isPrivate: false,
        translations: [{ languageCode: LanguageCode.ru, name: 'Категория' }],
    });
    const subcategoryFacet = await facetService.create(ctx, {
        code: 'subcategory',
        isPrivate: false,
        translations: [{ languageCode: LanguageCode.ru, name: 'Подкатегория' }],
    });
    const fillingFacet = await facetService.create(ctx, {
        code: 'filling',
        isPrivate: false,
        translations: [{ languageCode: LanguageCode.ru, name: 'Начинка' }],
    });

    for (const cat of CATEGORIES) {
        const value = await facetValueService.create(ctx, categoryFacet, {
            facetId: categoryFacet.id,
            code: cat.id,
            translations: [{ languageCode: LanguageCode.ru, name: cat.name }],
        });
        refs.category.set(cat.id, value.id);

        // Подкатегории повторяются между категориями («Классика» есть
        // и у пельменей, и у хинкали), поэтому код включает id категории.
        for (const [i, sub] of cat.subs.entries()) {
            const subValue = await facetValueService.create(ctx, subcategoryFacet, {
                facetId: subcategoryFacet.id,
                code: `${cat.id}-sub-${i}`,
                translations: [{ languageCode: LanguageCode.ru, name: sub }],
            });
            refs.subcategory.set(`${cat.id}:${i}`, subValue.id);
        }
    }

    for (const filling of FILLINGS) {
        const value = await facetValueService.create(ctx, fillingFacet, {
            facetId: fillingFacet.id,
            code: slugify(filling),
            translations: [{ languageCode: LanguageCode.ru, name: filling }],
        });
        refs.filling.set(filling, value.id);
    }

    console.log('  ✓ фасеты: категория, подкатегория, начинка');
    return refs;
}

function facetValueFilter(facetValueIds: ID[], combineWithAnd: boolean) {
    return {
        code: 'facet-value-filter',
        arguments: [
            { name: 'facetValueIds', value: JSON.stringify(facetValueIds.map(String)) },
            { name: 'containsAny', value: 'false' },
            { name: 'combineWithAnd', value: String(combineWithAnd) },
        ],
    };
}

async function seedCollections(
    ctx: RequestContext,
    collectionService: CollectionService,
    refs: FacetValueRefs,
): Promise<void> {
    for (const cat of CATEGORIES) {
        const categoryValueId = refs.category.get(cat.id)!;

        const collection = await collectionService.create(ctx, {
            isPrivate: false,
            filters: [facetValueFilter([categoryValueId], true)],
            translations: [
                {
                    languageCode: LanguageCode.ru,
                    name: cat.name,
                    slug: cat.id,
                    description: cat.desc,
                },
            ],
        });

        for (const [i, sub] of cat.subs.entries()) {
            const subValueId = refs.subcategory.get(`${cat.id}:${i}`)!;
            await collectionService.create(ctx, {
                isPrivate: false,
                parentId: collection.id,
                // Товар должен иметь и категорию, и подкатегорию — отсюда combineWithAnd.
                filters: [facetValueFilter([categoryValueId, subValueId], true)],
                translations: [
                    {
                        languageCode: LanguageCode.ru,
                        name: sub,
                        slug: `${cat.id}-${slugify(sub)}`,
                        description: buildSubDescription(cat, sub),
                    },
                ],
            });
        }
    }

    console.log(`  ✓ коллекции: ${CATEGORIES.length} категорий с подкатегориями`);
}
