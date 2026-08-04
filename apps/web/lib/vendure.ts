import { cookies } from 'next/headers';

/**
 * Клиент Shop API Vendure.
 *
 * Корзина у Vendure серверная: активный заказ привязан к сессионному токену,
 * а не к состоянию в браузере. Токен храним в httpOnly-cookie — так его не
 * достанет сторонний скрипт, и корзина переживает перезагрузку страницы.
 */

const SESSION_COOKIE = 'zamorozka_session';

/** Изнутри docker-сети адрес API другой, чем снаружи. */
function apiUrl(): string {
    return (
        process.env.SHOP_API_URL_INTERNAL ||
        process.env.NEXT_PUBLIC_SHOP_API_URL ||
        'http://localhost:3000/shop-api'
    );
}

export interface GraphQLError {
    message: string;
    extensions?: { code?: string };
}

class VendureApiError extends Error {
    constructor(
        message: string,
        readonly errors: GraphQLError[],
    ) {
        super(message);
        this.name = 'VendureApiError';
    }
}

interface QueryOptions {
    /** Ответы каталога кэшируются; всё, что касается заказа — никогда. */
    revalidate?: number | false;
    tags?: string[];
}

/**
 * Выполняет запрос к Shop API от имени текущей сессии.
 *
 * Vendure возвращает новый токен в заголовке `vendure-auth-token` — его нужно
 * сохранить, иначе следующий запрос создаст новую пустую корзину.
 */
export async function shopApi<T>(
    query: string,
    variables: Record<string, unknown> = {},
    options: QueryOptions = {},
): Promise<T> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    // `cache` и `next.revalidate` взаимоисключающие — задаём что-то одно.
    const caching: RequestInit & { next?: { revalidate?: number; tags?: string[] } } =
        options.revalidate === false || options.revalidate === undefined
            ? { cache: 'no-store' }
            : { next: { revalidate: options.revalidate, tags: options.tags } };

    const response = await fetch(apiUrl(), {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
        ...caching,
    });

    if (!response.ok) {
        throw new VendureApiError(`Shop API вернул ${response.status}`, []);
    }

    // Новый или продлённый токен сессии сохраняем обратно в cookie.
    const freshToken = response.headers.get('vendure-auth-token');
    if (freshToken && freshToken !== token) {
        try {
            cookieStore.set(SESSION_COOKIE, freshToken, {
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                maxAge: 60 * 60 * 24 * 30,
            });
        } catch {
            // В серверных компонентах запись cookie запрещена — там сессия
            // только читается. Записывают её Server Actions и Route Handlers.
        }
    }

    const body = (await response.json()) as { data?: T; errors?: GraphQLError[] };

    if (body.errors?.length) {
        throw new VendureApiError(body.errors[0].message, body.errors);
    }
    if (!body.data) {
        throw new VendureApiError('Пустой ответ Shop API', []);
    }

    return body.data;
}

export { SESSION_COOKIE, VendureApiError };
