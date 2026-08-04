/**
 * Зоны доставки и таблица соответствия адресов, перенесённые из прототипа.
 *
 * Модель доставки — плановая, а не «по требованию»: у каждой зоны свои дни
 * недели, интервал, стоимость, порог бесплатной доставки и дедлайн приёма
 * заказов. Ближайшие рейсы вычисляются из этих правил.
 */

export interface DeliveryZoneDef {
    code: string;
    name: string;
    /** Дни недели рейсов: 0 — воскресенье … 6 — суббота. */
    weekdays: number[];
    /** Интервал доставки, как показывается покупателю. */
    window: string;
    /** Стоимость доставки, рубли. */
    cost: number;
    /** Сумма заказа, начиная с которой доставка бесплатна, рубли. */
    freeThreshold: number;
    /** За сколько дней до рейса закрывается приём заказов. */
    deadlineDaysBefore: number;
    /** Час закрытия приёма заказов в день дедлайна. */
    deadlineHour: number;
}

export const DELIVERY_ZONES: DeliveryZoneDef[] = [
    { code: 'center', name: 'Центр', weekdays: [2, 5], window: '18:00–21:00', cost: 200, freeThreshold: 2500, deadlineDaysBefore: 1, deadlineHour: 15 },
    { code: 'south', name: 'Юг', weekdays: [3, 6], window: '17:00–20:00', cost: 300, freeThreshold: 3000, deadlineDaysBefore: 1, deadlineHour: 15 },
    { code: 'west', name: 'Запад', weekdays: [2, 5], window: '19:00–21:00', cost: 300, freeThreshold: 3000, deadlineDaysBefore: 1, deadlineHour: 15 },
    { code: 'north', name: 'Север', weekdays: [4, 0], window: '18:00–20:00', cost: 350, freeThreshold: 3500, deadlineDaysBefore: 1, deadlineHour: 15 },
];

/**
 * Пул адресов для автоподсказок. На MVP заменяет геокодер:
 * витрина показывает подсказки из этого списка, зона определяется по точному
 * совпадению строки. Точка подмены на DaData/Яндекс.Геокодер — `AddressLookupStrategy`.
 */
export const ADDRESS_POOL = [
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
];

export const ADDRESS_ZONE_MAP: Record<string, string> = {
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

// ─── Форматирование дат по-русски ─────────────────────────────────────────────

export const WEEKDAYS_NOM = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
export const WEEKDAYS_GEN = ['воскресенья', 'понедельника', 'вторника', 'среды', 'четверга', 'пятницы', 'субботы'];
export const WEEKDAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
export const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

export interface DeliveryRunDef {
    /** Дата рейса (начало дня). */
    date: Date;
    /** Момент, до которого принимаем заказы на этот рейс. */
    deadline: Date;
    window: string;
}

/**
 * Ближайшие рейсы зоны: перебираем календарь вперёд и оставляем те дни,
 * что попадают в расписание зоны и по которым дедлайн ещё не прошёл.
 */
export function computeNextRuns(zone: DeliveryZoneDef, count: number, now: Date = new Date()): DeliveryRunDef[] {
    const runs: DeliveryRunDef[] = [];
    const base = new Date(now);
    base.setHours(0, 0, 0, 0);

    // 45 дней с запасом: даже у зоны с одним рейсом в неделю этого хватает.
    for (let i = 0; i < 45 && runs.length < count; i++) {
        const day = new Date(base);
        day.setDate(base.getDate() + i);
        if (!zone.weekdays.includes(day.getDay())) continue;

        const deadline = new Date(day);
        deadline.setDate(day.getDate() - zone.deadlineDaysBefore);
        deadline.setHours(zone.deadlineHour, 0, 0, 0);

        if (deadline.getTime() > now.getTime()) {
            runs.push({ date: day, deadline, window: zone.window });
        }
    }
    return runs;
}

/** «вторник, 12 августа» — для заголовка ближайшего рейса. */
export function formatRunLong(d: Date): string {
    return `${WEEKDAYS_NOM[d.getDay()]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
}

/** «Вт, 12 августа» — для пилюль выбора другой даты. */
export function formatRunShort(d: Date): string {
    return `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
}

/** «до понедельника, 15:00» — дедлайн приёма заказа. */
export function formatDeadline(d: Date): string {
    return `до ${WEEKDAYS_GEN[d.getDay()]}, ${String(d.getHours()).padStart(2, '0')}:00`;
}

/** Русское склонение по числу: 1 рубль / 2 рубля / 5 рублей. */
export function pluralRu(n: number, one: string, few: string, many: string): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
}
