import type { Metadata } from 'next';

import type { Category, ProductDetail, Subcategory } from './api/catalog';
import { subcategoryHref } from './catalog-routes';

export const SITE_NAME = 'Скаска';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://skaskadoma.ru').replace(/\/$/, '');

const SUBCATEGORY_TITLES: Record<string, Record<string, string>> = {
    pelmeni: {
        'Классика': 'Классические пельмени ручной лепки в СПб',
        'Птица': 'Пельмени с курицей и индейкой в СПб',
        'Рыба/Постное': 'Пельмени с рыбой и постные в СПб',
    },
    vareniki: {
        'С картофелем': 'Вареники с картофелем ручной лепки в СПб',
        'С творогом': 'Вареники с творогом ручной лепки в СПб',
        'С вишней': 'Вареники с вишней ручной лепки в СПб',
    },
    manty: {
        'Говядина/баранина': 'Манты с говядиной и бараниной в СПб',
        'Тыква': 'Манты с тыквой ручной лепки в СПб',
        'Курица': 'Манты с курицей ручной лепки в СПб',
    },
    hinkali: {
        'Классика': 'Классические хинкали ручной лепки в СПб',
        'Сыр': 'Хинкали с сыром ручной лепки в СПб',
        'Грибы': 'Хинкали с грибами ручной лепки в СПб',
    },
    khanum: {
        'С мясом': 'Ханум с мясом с доставкой по СПб',
        'С картофелем': 'Ханум с картофелем с доставкой по СПб',
        'Вегетарианские': 'Вегетарианский ханум с доставкой по СПб',
    },
    lapsha: {
        'Домашняя': 'Домашняя пшеничная лапша в СПб',
        'Гречневая': 'Гречневая лапша с доставкой по СПб',
        'Рисовая': 'Рисовая лапша с доставкой по СПб',
    },
    gastrolavka: {
        'Соусы': 'Соусы к пельменям и домашним блюдам',
        'Масло и сливки': 'Масло и сливки для домашних блюд',
        'Бульоны': 'Бульонные концентраты с доставкой по СПб',
        'Топпинги': 'Топпинги для пельменей и вареников',
    },
};

export function absoluteUrl(path = '/'): string {
    return new URL(path, `${SITE_URL}/`).toString();
}

export function plainText(value: string): string {
    return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function conciseDescription(value: string, maxLength = 180): string {
    const normalized = plainText(value);
    if (normalized.length <= maxLength) return normalized;

    const clipped = normalized.slice(0, maxLength - 1);
    const lastSpace = clipped.lastIndexOf(' ');
    return `${clipped.slice(0, lastSpace > 120 ? lastSpace : clipped.length).trimEnd()}…`;
}

function socialImages(assetUrl: string | null, alt: string) {
    return assetUrl ? [{ url: assetUrl, alt }] : undefined;
}

export function catalogMetadata(category: Category, subcategory?: Subcategory): Metadata {
    const path = subcategory
        ? subcategoryHref(category.slug, subcategory.slug)
        : `/${category.slug}`;
    const title = subcategory
        ? SUBCATEGORY_TITLES[category.slug]?.[subcategory.name] ?? `${category.name}: ${subcategory.name}`
        : `${category.name} ручной лепки в Санкт-Петербурге`;
    const description = conciseDescription(subcategory?.description || category.description);
    const imageAlt = subcategory
        ? `${category.name}: ${subcategory.name}`
        : category.name;
    const images = socialImages(subcategory?.assetUrl || category.assetUrl, imageAlt);

    return {
        title,
        description,
        alternates: { canonical: path },
        robots: { index: true, follow: true },
        openGraph: {
            type: 'website',
            locale: 'ru_RU',
            siteName: SITE_NAME,
            title: `${title} | ${SITE_NAME}`,
            description,
            url: path,
            images,
        },
        twitter: {
            card: images ? 'summary_large_image' : 'summary',
            title: `${title} | ${SITE_NAME}`,
            description,
            images: images?.map(image => image.url),
        },
    };
}

export function productMetadata(product: ProductDetail): Metadata {
    const path = `/product/${product.slug}`;
    const productName = plainText(product.name);
    const sourceDescription = plainText(product.description);
    const description = sourceDescription
        ? conciseDescription(`${productName}. ${sourceDescription}`)
        : `${productName} в магазине домашних полуфабрикатов «${SITE_NAME}».`;
    const title = `${productName} — заказать в СПб`;
    const images = socialImages(product.assetUrl, productName);

    return {
        title,
        description,
        alternates: { canonical: path },
        robots: { index: true, follow: true },
        openGraph: {
            type: 'website',
            locale: 'ru_RU',
            siteName: SITE_NAME,
            title: `${title} | ${SITE_NAME}`,
            description,
            url: path,
            images,
        },
        twitter: {
            card: images ? 'summary_large_image' : 'summary',
            title: `${title} | ${SITE_NAME}`,
            description,
            images: images?.map(image => image.url),
        },
    };
}

/** Безопасная вставка JSON-LD в server-rendered HTML. */
export function serializeJsonLd(data: unknown): string {
    return JSON.stringify(data).replace(/</g, '\\u003c');
}
