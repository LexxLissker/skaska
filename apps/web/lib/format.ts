/** Копейки → «1 990 ₽». Цены в Vendure хранятся в минорных единицах. */
export function formatPrice(minorUnits: number): string {
    const roubles = Math.round(minorUnits / 100);
    return `${roubles.toLocaleString('ru-RU')} ₽`;
}

/** Копейки → «1 990» без символа валюты (для кнопок вида «+ 430 ₽»). */
export function formatAmount(minorUnits: number): string {
    return Math.round(minorUnits / 100).toLocaleString('ru-RU');
}

/** Русское склонение по числу: 1 товар / 2 товара / 5 товаров. */
export function pluralRu(n: number, one: string, few: string, many: string): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
}

/**
 * Живая маска телефона `+7 (___) ___-__-__`.
 * Возвращает и отображаемую строку, и чистые цифры — вторые уходят на сервер.
 */
export function formatPhone(input: string): { display: string; digits: string } {
    let digits = input.replace(/\D/g, '');

    // Ввод может начинаться с 8 или +7 — приводим к единому виду.
    if (digits.startsWith('8')) digits = `7${digits.slice(1)}`;
    if (!digits.startsWith('7')) digits = `7${digits}`;
    digits = digits.slice(0, 11);

    const rest = digits.slice(1);
    let display = '+7';
    if (rest.length > 0) display += ` (${rest.slice(0, 3)}`;
    if (rest.length >= 3) display += ')';
    if (rest.length > 3) display += ` ${rest.slice(3, 6)}`;
    if (rest.length > 6) display += `-${rest.slice(6, 8)}`;
    if (rest.length > 8) display += `-${rest.slice(8, 10)}`;

    return { display, digits };
}

/** Телефон введён полностью: 7 + 10 цифр. */
export function isPhoneComplete(digits: string): boolean {
    return digits.length === 11;
}
