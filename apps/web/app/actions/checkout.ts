'use server';

import { NO_CACHE, ORDER_FRAGMENT, normalizeOrder, type Cart, type RawOrder } from '@/lib/api/cart';
import { demoCart, isDemoStorefront } from '@/lib/demo-catalog';
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

const DEMO_ADDRESSES = [
    'ул. Тверская, 12',
    'ул. Тверская, 18, корп. 1',
    'ул. Арбат, 25',
    'Ленинский проспект, 45',
    'Ленинский проспект, 90, корп. 2',
    'ул. Профсоюзная, 3',
    'Кутузовский проспект, 30',
    'ул. Пятницкая, 20',
    'Ленинградское шоссе, 16',
    'ул. Новослободская, 8',
] as const;

interface DemoZone {
    code: string;
    name: string;
    days: number[];
    window: string;
    cost: number;
    freeThreshold: number;
    deadlineDaysBefore: number;
    deadlineHour: number;
}

const DEMO_ZONES: Record<string, DemoZone> = {
    center: {
        code: 'center',
        name: 'Центр',
        days: [2, 5],
        window: '18:00–21:00',
        cost: 20000,
        freeThreshold: 250000,
        deadlineDaysBefore: 1,
        deadlineHour: 15,
    },
    south: {
        code: 'south',
        name: 'Юг',
        days: [3, 6],
        window: '17:00–20:00',
        cost: 30000,
        freeThreshold: 300000,
        deadlineDaysBefore: 1,
        deadlineHour: 15,
    },
    west: {
        code: 'west',
        name: 'Запад',
        days: [2, 5],
        window: '19:00–21:00',
        cost: 30000,
        freeThreshold: 300000,
        deadlineDaysBefore: 1,
        deadlineHour: 15,
    },
    north: {
        code: 'north',
        name: 'Север',
        days: [4, 0],
        window: '18:00–20:00',
        cost: 35000,
        freeThreshold: 350000,
        deadlineDaysBefore: 1,
        deadlineHour: 15,
    },
};

const DEMO_ADDRESS_ZONES: Record<(typeof DEMO_ADDRESSES)[number], keyof typeof DEMO_ZONES> = {
    'ул. Тверская, 12': 'center',
    'ул. Тверская, 18, корп. 1': 'center',
    'ул. Арбат, 25': 'center',
    'ул. Пятницкая, 20': 'center',
    'ул. Новослободская, 8': 'center',
    'Ленинский проспект, 45': 'south',
    'Ленинский проспект, 90, корп. 2': 'south',
    'ул. Профсоюзная, 3': 'south',
    'Кутузовский проспект, 30': 'west',
    'Ленинградское шоссе, 16': 'north',
};

const WEEKDAYS_NOM = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const WEEKDAYS_GEN = ['воскресенья', 'понедельника', 'вторника', 'среды', 'четверга', 'пятницы', 'субботы'];
const WEEKDAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTHS_GEN = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
];

function demoRuns(zone: DemoZone, count = 4): DeliveryRunOption[] {
    const now = new Date();
    const base = new Date(now);
    base.setHours(0, 0, 0, 0);
    const runs: DeliveryRunOption[] = [];

    for (let offset = 0; offset < 45 && runs.length < count; offset += 1) {
        const date = new Date(base);
        date.setDate(base.getDate() + offset);
        if (!zone.days.includes(date.getDay())) continue;

        const deadline = new Date(date);
        deadline.setDate(date.getDate() - zone.deadlineDaysBefore);
        deadline.setHours(zone.deadlineHour, 0, 0, 0);
        if (deadline.getTime() <= now.getTime()) continue;

        const dateLabel = `${date.getDate()} ${MONTHS_GEN[date.getMonth()]}`;
        runs.push({
            id: `${zone.code}-${date.toISOString().slice(0, 10)}`,
            label: `${WEEKDAYS_NOM[date.getDay()]}, ${dateLabel}`,
            shortLabel: `${WEEKDAYS_SHORT[date.getDay()]}, ${dateLabel}`,
            window: zone.window,
            deadlineLabel: `до ${WEEKDAYS_GEN[deadline.getDay()]}, ${String(deadline.getHours()).padStart(2, '0')}:00`,
            placesLeft: Math.max(2, 8 - runs.length),
        });
    }

    return runs;
}

function demoDeliveryOptions(address: string): DeliveryOptions {
    const zoneKey = DEMO_ADDRESS_ZONES[address as keyof typeof DEMO_ADDRESS_ZONES];
    const definition = zoneKey ? DEMO_ZONES[zoneKey] : null;
    if (!definition) return { zone: null, runs: [] };

    const remainingForFree = Math.max(0, definition.freeThreshold - demoCart.subTotal);
    const cost = remainingForFree === 0 ? 0 : definition.cost;
    return {
        zone: {
            code: definition.code,
            name: definition.name,
            window: definition.window,
            cost,
            freeThreshold: definition.freeThreshold,
            remainingForFree,
        },
        runs: demoRuns(definition),
    };
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
    if (isDemoStorefront) {
        const normalized = query.trim().toLocaleLowerCase('ru-RU');
        return DEMO_ADDRESSES.filter(address =>
            address.toLocaleLowerCase('ru-RU').includes(normalized),
        ).slice(0, 4);
    }
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
    if (isDemoStorefront) {
        demoCart.shippingAddress = { streetLine1: address };
        const options = demoDeliveryOptions(address);
        demoCart.shipping = options.zone?.cost ?? 0;
        demoCart.total = demoCart.subTotal + demoCart.shipping;
        return { cart: demoCart, options };
    }

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
    if (isDemoStorefront) {
        demoCart.customer = { phoneNumber: `+${phoneDigits}` };
        return null;
    }

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
    if (isDemoStorefront) return demoCart;

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
    if (isDemoStorefront) {
        demoCart.state = 'PaymentSettled';
        return { orderCode: `DEMO-${String(Date.now()).slice(-6)}`, error: null };
    }

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
