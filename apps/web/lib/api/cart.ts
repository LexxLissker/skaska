import { shopApi } from '../vendure';
import { demoCart, isDemoStorefront } from '../demo-catalog';

/** Всё, что касается заказа, читается всегда свежим — кэшировать корзину нельзя. */
const NO_CACHE = { revalidate: false as const };

export interface CartLine {
    id: string;
    quantity: number;
    unitPrice: number;
    linePrice: number;
    productName: string;
    productSlug: string;
    variantName: string;
    weight: string;
    assetUrl: string | null;
    /** Подпись выбранной конфигурации: «Полбяное, Рубленое ножом» или «Стандарт». */
    variantLabel: string;
    options: Record<string, string | null>;
}

export interface Cart {
    id: string;
    code: string;
    state: string;
    totalQuantity: number;
    subTotal: number;
    shipping: number;
    total: number;
    couponCodes: string[];
    discounts: Array<{ description: string; amount: number }>;
    lines: CartLine[];
    customer: { phoneNumber: string | null } | null;
    shippingAddress: { streetLine1: string | null } | null;
}

const ORDER_FRAGMENT = /* GraphQL */ `
    fragment CartFields on Order {
        id
        code
        state
        totalQuantity
        subTotalWithTax
        shippingWithTax
        totalWithTax
        couponCodes
        discounts {
            description
            amountWithTax
        }
        customer {
            phoneNumber
        }
        shippingAddress {
            streetLine1
        }
        lines {
            id
            quantity
            unitPriceWithTax
            linePriceWithTax
            customFields {
                dough
                fat
                color
                texture
            }
            featuredAsset {
                preview
            }
            productVariant {
                id
                name
                sku
                product {
                    name
                    slug
                }
            }
        }
    }
`;

interface RawOrder {
    id: string;
    code: string;
    state: string;
    totalQuantity: number;
    subTotalWithTax: number;
    shippingWithTax: number;
    totalWithTax: number;
    couponCodes: string[];
    discounts: Array<{ description: string; amountWithTax: number }>;
    customer: { phoneNumber: string | null } | null;
    shippingAddress: { streetLine1: string | null } | null;
    lines: Array<{
        id: string;
        quantity: number;
        unitPriceWithTax: number;
        linePriceWithTax: number;
        customFields: Record<string, string | null>;
        featuredAsset: { preview: string } | null;
        productVariant: {
            id: string;
            name: string;
            sku: string;
            product: { name: string; slug: string };
        };
    }>;
}

/**
 * Подписи опций для строки корзины. Значения по умолчанию не показываем —
 * в макете строка без изменений подписана «Стандарт».
 */
const OPTION_LABELS: Record<string, Record<string, string>> = {
    dough: {
        polba: 'Полбяное',
        wholegrain: 'Цельнозерновое',
        rye: 'Ржано-пшеничное',
        buckwheat: 'Гречневое',
        glutenfree: 'Безглютеновое',
    },
    fat: { butter: 'Сливочное масло', olive: 'Оливковое масло', cream: 'Сливки 33%' },
    color: { green: 'Зелёное', orange: 'Оранжевое', black: 'Чёрное' },
    texture: { chopped: 'Рубленое ножом' },
};

function buildVariantLabel(customFields: Record<string, string | null>): string {
    const parts: string[] = [];
    for (const [group, values] of Object.entries(OPTION_LABELS)) {
        const selected = customFields[group];
        if (selected && values[selected]) parts.push(values[selected]);
    }
    return parts.length ? parts.join(', ') : 'Стандарт';
}

export function normalizeOrder(order: RawOrder | null): Cart | null {
    if (!order) return null;

    return {
        id: order.id,
        code: order.code,
        state: order.state,
        totalQuantity: order.totalQuantity,
        subTotal: order.subTotalWithTax,
        shipping: order.shippingWithTax,
        total: order.totalWithTax,
        couponCodes: order.couponCodes ?? [],
        discounts: (order.discounts ?? []).map(d => ({
            description: d.description,
            amount: d.amountWithTax,
        })),
        customer: order.customer,
        shippingAddress: order.shippingAddress,
        lines: order.lines.map(line => ({
            id: line.id,
            quantity: line.quantity,
            unitPrice: line.unitPriceWithTax,
            linePrice: line.linePriceWithTax,
            productName: line.productVariant.product.name,
            productSlug: line.productVariant.product.slug,
            variantName: line.productVariant.name,
            weight: line.productVariant.sku.endsWith('-1000') ? '1 кг' : '0.5 кг',
            assetUrl: line.featuredAsset?.preview ?? null,
            variantLabel: buildVariantLabel(line.customFields ?? {}),
            options: line.customFields ?? {},
        })),
    };
}

const ACTIVE_ORDER_QUERY = /* GraphQL */ `
    ${ORDER_FRAGMENT}
    query ActiveOrder {
        activeOrder {
            ...CartFields
        }
    }
`;

export async function getCart(): Promise<Cart | null> {
    // На этапе фронтенд-просмотра Shop API ещё не запущен. Пустая корзина
    // позволяет открыть экран и проверить дизайн, не маскируя его ошибкой сети.
    try {
        const data = await shopApi<{ activeOrder: RawOrder | null }>(ACTIVE_ORDER_QUERY, {}, NO_CACHE);
        return normalizeOrder(data.activeOrder);
    } catch (error) {
        if (isDemoStorefront) return demoCart;
        throw error;
    }
}

export { ORDER_FRAGMENT, NO_CACHE };
export type { RawOrder };
