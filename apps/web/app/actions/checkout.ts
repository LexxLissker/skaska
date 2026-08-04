'use server';

import { NO_CACHE, ORDER_FRAGMENT, normalizeOrder, type Cart, type RawOrder } from '@/lib/api/cart';
import { shopApi } from '@/lib/vendure';

export interface DeliveryRunOption {
    id: string;
    label: string;
    shortLabel: string;
    window: string;
    deadlineLabel: string;
    placesLeft: number;
}

export interface DeliveryOptions {
    zone: {
        code: string;
        name: string;
        window: string;
        cost: number;
        freeThreshold: number;
        remainingForFree: number;
    } | null;
    runs: DeliveryRunOption[];
}

const SUGGESTIONS_QUERY = /* GraphQL */ `
    query AddressSuggestions($query: String!) {
        deliveryAddressSuggestions(query: $query, limit: 6) {
            value
        }
    }
`;

export async function suggestAddresses(query: string): Promise<string[]> {
    if (query.trim().length < 2) return [];
    const data = await shopApi<{ deliveryAddressSuggestions: Array<{ value: string }> }>(
        SUGGESTIONS_QUERY,
        { query },
        { revalidate: 300 },
    );
    return data.deliveryAddressSuggestions.map(s => s.value);
}

const DELIVERY_OPTIONS_QUERY = /* GraphQL */ `
    query DeliveryOptions($address: String!) {
        deliveryOptions(address: $address) {
            zone {
                code
                name
                window
                cost
                freeThreshold
                remainingForFree
            }
            runs {
                id
                label
                shortLabel
                window
                deadlineLabel
                placesLeft
            }
        }
    }
`;

const SET_SHIPPING_ADDRESS = /* GraphQL */ `
    ${ORDER_FRAGMENT}
    mutation SetShippingAddress($address: CreateAddressInput!) {
        setOrderShippingAddress(input: $address) {
            __typename
            ...CartFields
            ... on ErrorResult {
                message
            }
        }
    }
`;

/**
 * Сохраняет адрес на заказе и возвращает варианты доставки для него.
 *
 * Адрес пишется до расчёта, потому что ShippingCalculator на сервере
 * определяет зону именно по адресу заказа.
 */
export async function setAddressAndGetOptions(
    address: string,
): Promise<{ cart: Cart | null; options: DeliveryOptions }> {
    await shopApi<{ setOrderShippingAddress: any }>(
        SET_SHIPPING_ADDRESS,
        {
            address: {
                streetLine1: address,
                city: 'Москва',
                countryCode: 'RU',
                postalCode: '000000',
            },
        },
        NO_CACHE,
    );

    const data = await shopApi<{ deliveryOptions: DeliveryOptions }>(
        DELIVERY_OPTIONS_QUERY,
        { address },
        NO_CACHE,
    );

    const cart = await getOrder();
    return { cart, options: data.deliveryOptions };
}

const ACTIVE_ORDER = /* GraphQL */ `
    ${ORDER_FRAGMENT}
    query ActiveOrderForCheckout {
        activeOrder {
            ...CartFields
        }
    }
`;

async function getOrder(): Promise<Cart | null> {
    const data = await shopApi<{ activeOrder: RawOrder | null }>(ACTIVE_ORDER, {}, NO_CACHE);
    return normalizeOrder(data.activeOrder);
}

const SET_CUSTOMER = /* GraphQL */ `
    mutation SetCustomer($input: CreateCustomerInput!) {
        setCustomerForOrder(input: $input) {
            __typename
            ... on ErrorResult {
                message
            }
        }
    }
`;

/**
 * Vendure требует email для покупателя, а магазин работает по номеру телефона.
 * Пока нет входа по SMS, синтезируем технический адрес из номера — он никуда
 * не отправляется и заменится настоящим, когда появится авторизация.
 */
export async function setContactPhone(phoneDigits: string): Promise<string | null> {
    const data = await shopApi<{ setCustomerForOrder: { __typename: string; message?: string } }>(
        SET_CUSTOMER,
        {
            input: {
                firstName: 'Покупатель',
                lastName: phoneDigits.slice(-4),
                phoneNumber: `+${phoneDigits}`,
                emailAddress: `${phoneDigits}@phone.zamorozka.local`,
            },
        },
        NO_CACHE,
    );

    const result = data.setCustomerForOrder;
    return result.__typename === 'Order' ? null : (result.message ?? 'Не удалось сохранить телефон');
}

const ELIGIBLE_SHIPPING = /* GraphQL */ `
    query EligibleShipping {
        eligibleShippingMethods {
            id
            name
            priceWithTax
            metadata
        }
    }
`;

const SET_SHIPPING_METHOD = /* GraphQL */ `
    ${ORDER_FRAGMENT}
    mutation SetShippingMethod($id: [ID!]!) {
        setOrderShippingMethod(shippingMethodId: $id) {
            __typename
            ...CartFields
            ... on ErrorResult {
                message
            }
        }
    }
`;

const SET_ORDER_CUSTOM_FIELDS = /* GraphQL */ `
    ${ORDER_FRAGMENT}
    mutation SetOrderCustomFields($input: UpdateOrderInput!) {
        setOrderCustomFields(input: $input) {
            __typename
            ...CartFields
        }
    }
`;

/** Привязывает к заказу способ доставки и выбранный рейс. */
export async function chooseDeliveryRun(
    runId: string,
    zoneCode: string,
    window: string,
): Promise<Cart | null> {
    const methods = await shopApi<{
        eligibleShippingMethods: Array<{ id: string; priceWithTax: number }>;
    }>(ELIGIBLE_SHIPPING, {}, NO_CACHE);

    if (methods.eligibleShippingMethods.length) {
        await shopApi(SET_SHIPPING_METHOD, { id: [methods.eligibleShippingMethods[0].id] }, NO_CACHE);
    }

    const data = await shopApi<{ setOrderCustomFields: RawOrder }>(
        SET_ORDER_CUSTOM_FIELDS,
        {
            input: {
                customFields: {
                    deliveryRunId: runId,
                    deliveryZoneCode: zoneCode,
                    deliveryWindow: window,
                },
            },
        },
        NO_CACHE,
    );

    return normalizeOrder(data.setOrderCustomFields);
}

const TRANSITION = /* GraphQL */ `
    mutation Transition($state: String!) {
        transitionOrderToState(state: $state) {
            __typename
            ... on OrderStateTransitionError {
                message
                transitionError
            }
        }
    }
`;

const ADD_PAYMENT = /* GraphQL */ `
    mutation AddPayment($method: String!) {
        addPaymentToOrder(input: { method: $method, metadata: {} }) {
            __typename
            ... on Order {
                id
                code
                state
            }
            ... on ErrorResult {
                message
            }
        }
    }
`;

export interface PaymentResult {
    orderCode: string | null;
    error: string | null;
}

/**
 * Проводит оплату. На MVP обработчик `sbp` — заглушка, которая сразу помечает
 * платёж проведённым; реальный провайдер подставляется на его место.
 */
export async function payOrder(): Promise<PaymentResult> {
    const transition = await shopApi<{
        transitionOrderToState: { __typename: string; message?: string };
    }>(TRANSITION, { state: 'ArrangingPayment' }, NO_CACHE);

    if (transition.transitionOrderToState.__typename !== 'Order') {
        return {
            orderCode: null,
            error: transition.transitionOrderToState.message ?? 'Заказ не готов к оплате',
        };
    }

    const payment = await shopApi<{
        addPaymentToOrder: { __typename: string; code?: string; message?: string };
    }>(ADD_PAYMENT, { method: 'sbp' }, NO_CACHE);

    const result = payment.addPaymentToOrder;
    if (result.__typename !== 'Order') {
        return { orderCode: null, error: result.message ?? 'Оплата не прошла' };
    }

    return { orderCode: result.code ?? null, error: null };
}
