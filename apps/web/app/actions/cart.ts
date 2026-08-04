'use server';

import { revalidatePath } from 'next/cache';

import { NO_CACHE, ORDER_FRAGMENT, normalizeOrder, type Cart, type RawOrder } from '@/lib/api/cart';
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
    const data = await shopApi<{ removeCouponCode: RawOrder | null }>(
        REMOVE_COUPON,
        { code },
        NO_CACHE,
    );
    revalidatePath('/cart');
    return { cart: normalizeOrder(data.removeCouponCode), error: null };
}
