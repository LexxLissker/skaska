'use server';

import { revalidatePath } from 'next/cache';

import { NO_CACHE, ORDER_FRAGMENT, normalizeOrder, type Cart, type CartLine, type RawOrder } from '@/lib/api/cart';
import { demoCart, demoProduct, isDemoStorefront } from '@/lib/demo-catalog';
import { shopApi } from '@/lib/vendure';

export interface CartActionResult {
    cart: Cart | null;
    error: string | null;
}

/**
 * Ошибки Vendure приходят как ErrorResult внутри данных, а не как исключение.
 * Приводим их к человеческому сообщению — покупателю нужен текст, а не код.
 */
function toResult(payload: { __typename?: string; message?: string } & Partial<RawOrder>): CartActionResult {
    if (payload?.__typename && payload.__typename !== 'Order') {
        return { cart: null, error: payload.message ?? 'Не удалось выполнить действие' };
    }
    return { cart: normalizeOrder(payload as RawOrder), error: null };
}

function refreshDemoTotals() {
    demoCart.totalQuantity = demoCart.lines.reduce((sum, line) => sum + line.quantity, 0);
    demoCart.subTotal = demoCart.lines.reduce((sum, line) => sum + line.linePrice, 0);
    demoCart.total = demoCart.subTotal + demoCart.shipping;
}

function demoVariantLabel(options: Record<string, string>) {
    const labels: Record<string, string> = {
        polba: 'Полбяное', wholegrain: 'Цельнозерновое', butter: 'Сливочное масло',
        olive: 'Оливковое масло', green: 'Зелёное', orange: 'Оранжевое', chopped: 'Рубленое ножом',
    };
    const selected = Object.values(options).map(option => labels[option]).filter(Boolean);
    return selected.length ? selected.join(', ') : 'Стандарт';
}

function demoAddItem(variantId: string, quantity: number, options: Record<string, string>): CartActionResult {
    const match = /^demo-(.+)-(\d+)-(500|1000)$/.exec(variantId);
    if (!match) return { cart: null, error: 'Этот товар появится после подключения каталога' };

    const [, category, index, weight] = match;
    const product = demoProduct(`${category}-${index}`);
    const variant = product?.variants.find(item => item.weight === weight);
    if (!product || !variant) return { cart: null, error: 'Не удалось найти товар' };

    const existing = demoCart.lines.find(
        line => line.productSlug === product.slug && line.weight === `${weight === '500' ? '0.5' : '1'} кг` && line.variantLabel === demoVariantLabel(options),
    );
    if (existing) {
        existing.quantity += quantity;
        existing.linePrice = existing.unitPrice * existing.quantity;
    } else {
        const line: CartLine = {
            id: `demo-line-${crypto.randomUUID()}`,
            quantity,
            unitPrice: variant.price,
            linePrice: variant.price * quantity,
            productName: product.name,
            productSlug: product.slug,
            variantName: variant.name,
            weight: weight === '500' ? '0.5 кг' : '1 кг',
            assetUrl: product.assetUrl,
            variantLabel: demoVariantLabel(options),
            options,
        };
        demoCart.lines.push(line);
    }
    refreshDemoTotals();
    return { cart: demoCart, error: null };
}

const ADD_ITEM = /* GraphQL */ `
    ${ORDER_FRAGMENT}
    mutation AddItem($variantId: ID!, $quantity: Int!, $customFields: OrderLineCustomFieldsInput) {
        addItemToOrder(
            productVariantId: $variantId
            quantity: $quantity
            customFields: $customFields
        ) {
            __typename
            ...CartFields
            ... on ErrorResult {
                errorCode
                message
            }
        }
    }
`;

export async function addToCart(
    variantId: string,
    quantity: number,
    options: Record<string, string> = {},
): Promise<CartActionResult> {
    if (isDemoStorefront) return demoAddItem(variantId, quantity, options);
    const data = await shopApi<{ addItemToOrder: any }>(
        ADD_ITEM,
        { variantId, quantity, customFields: options },
        NO_CACHE,
    );
    revalidatePath('/cart');
    return toResult(data.addItemToOrder);
}

const ADJUST_LINE = /* GraphQL */ `
    ${ORDER_FRAGMENT}
    mutation AdjustLine($lineId: ID!, $quantity: Int!) {
        adjustOrderLine(orderLineId: $lineId, quantity: $quantity) {
            __typename
            ...CartFields
            ... on ErrorResult {
                errorCode
                message
            }
        }
    }
`;

/** Количество 0 удаляет строку — отдельная мутация для этого не нужна. */
export async function setLineQuantity(lineId: string, quantity: number): Promise<CartActionResult> {
    if (isDemoStorefront) {
        const line = demoCart.lines.find(item => item.id === lineId);
        if (!line) return { cart: demoCart, error: null };
        if (quantity <= 0) demoCart.lines = demoCart.lines.filter(item => item.id !== lineId);
        else {
            line.quantity = quantity;
            line.linePrice = line.unitPrice * quantity;
        }
        refreshDemoTotals();
        return { cart: demoCart, error: null };
    }
    const data = await shopApi<{ adjustOrderLine: any }>(
        ADJUST_LINE,
        { lineId, quantity: Math.max(0, quantity) },
        NO_CACHE,
    );
    revalidatePath('/cart');
    return toResult(data.adjustOrderLine);
}

const APPLY_COUPON = /* GraphQL */ `
    ${ORDER_FRAGMENT}
    mutation ApplyCoupon($code: String!) {
        applyCouponCode(couponCode: $code) {
            __typename
            ...CartFields
            ... on ErrorResult {
                errorCode
                message
            }
        }
    }
`;

export async function applyPromoCode(code: string): Promise<CartActionResult> {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return { cart: null, error: 'Введите промокод' };

    if (isDemoStorefront) return { cart: null, error: 'Промокоды подключим вместе с Vendure' };

    const data = await shopApi<{ applyCouponCode: any }>(APPLY_COUPON, { code: trimmed }, NO_CACHE);
    const result = toResult(data.applyCouponCode);

    // Единая формулировка на все причины отказа: покупателю всё равно,
    // промокод не существует, истёк или не подходит к этому заказу.
    if (result.error) return { cart: null, error: 'Промокод не найден' };

    revalidatePath('/cart');
    return result;
}

const REMOVE_COUPON = /* GraphQL */ `
    ${ORDER_FRAGMENT}
    mutation RemoveCoupon($code: String!) {
        removeCouponCode(couponCode: $code) {
            ...CartFields
        }
    }
`;

export async function removePromoCode(code: string): Promise<CartActionResult> {
    if (isDemoStorefront) return { cart: demoCart, error: null };
    const data = await shopApi<{ removeCouponCode: RawOrder | null }>(
        REMOVE_COUPON,
        { code },
        NO_CACHE,
    );
    revalidatePath('/cart');
    return { cart: normalizeOrder(data.removeCouponCode), error: null };
}
