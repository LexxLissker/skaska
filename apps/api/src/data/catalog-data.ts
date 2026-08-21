/**
 * Данные каталога, перенесённые из дизайн-прототипа
 * (`docs/design/Заморозка PWA.dc.html`).
 *
 * Это единственный источник правды и для seed-скрипта, и для плагина-конфигуратора:
 * наценки за опции должны совпадать с тем, что видит покупатель на витрине,
 * иначе цена в заказе разойдётся с ценой в карточке товара.
 *
 * Все цены здесь — в рублях, как в прототипе. Vendure хранит цены в копейках,
 * поэтому на входе в базу применяется `toMinorUnits()`.
 */

/** Рубли → копейки (внутреннее представление цен в Vendure). */
export function toMinorUnits(roubles: number): number {
    return Math.round(roubles * 100);
}

export interface OptionChoice {
    id: string;
    label: string;
    /** Наценка к цене варианта, в рублях. */
    delta: number;
    /** Поправка к БЖУ на 100 г относительно базовой для категории. */
    bju: { p: number; f: number; c: number; k: number };
    hint: string;
    /** Как опция называется в составе продукта. Пусто — в состав не попадает. */
    ingredient: string;
}

export interface CategoryDef {
    id: string;
    name: string;
    subs: string[];
    desc: string;
}

// ─── Категории и начинки ──────────────────────────────────────────────────────

export const FILLINGS = [
    'Говядина/свинина',
    'Курица и индейка',
    'Телятина',
    'С грибами',
    'Со шпинатом и сыром',
    'Бабушкин рецепт',
    'Сибирские',
    'Уральские',
    'С бараниной',
    'Классические',
    'Домашние',
    'Мини-формат',
    'Большая упаковка XXL',
    'Постные',
    'Фермерские',
    'С зеленью',
] as const;

export const CATEGORIES: CategoryDef[] = [
    {
        id: 'pelmeni',
        name: 'Пельмени',
        subs: ['Классика', 'Птица', 'Рыба/Постное'],
        desc: 'Пельмени ручной лепки из охлаждённого мяса. Замораживаем в день лепки — готовим 7 минут, без разморозки.',
    },
    {
        id: 'vareniki',
        name: 'Вареники',
        subs: ['С картофелем', 'С творогом', 'С вишней'],
        desc: 'Вареники из тонкого теста с начинкой из творога, картофеля или вишни. Лепим вручную и замораживаем сразу после лепки.',
    },
    {
        id: 'manty',
        name: 'Манты',
        subs: ['Говядина/баранина', 'Тыква', 'Курица'],
        desc: 'Манты на пару из рубленого мяса и лука. Крупная лепка и сочная начинка, готовим на пару 25–30 минут.',
    },
    {
        id: 'hinkali',
        name: 'Хинкали',
        subs: ['Классика', 'Сыр', 'Грибы'],
        desc: 'Хинкали с бульоном внутри по грузинской рецептуре. Плотное тесто держит сок при варке.',
    },
    {
        id: 'khanum',
        name: 'Ханум',
        subs: ['С мясом', 'С картофелем', 'Вегетарианские'],
        desc: 'Ханум — рулеты из тонкого теста с мясной или овощной начинкой, приготовленные на пару.',
    },
    {
        id: 'lapsha',
        name: 'Лапша',
        subs: ['Домашняя', 'Гречневая', 'Рисовая'],
        desc: 'Домашняя лапша и лапша из цельнозерновой муки. Быстро готовится и держит форму при варке.',
    },
    {
        id: 'gastrolavka',
        name: 'Гастролавка',
        subs: ['Соусы', 'Масло и сливки', 'Бульоны', 'Топпинги'],
        desc: 'Соусы, топлёное масло, бульонные концентраты и хрустящие топпинги — чтобы разморозка стала настоящим ужином.',
    },
];

/** Категории «Гастролавки» — товары-дополнения без групп опций. */
export const ADDON_CATEGORY_ID = 'gastrolavka';

export function buildSubDescription(cat: CategoryDef, subName: string): string {
    return (
        `${subName} — ${cat.name.toLowerCase()} ручной лепки, которые лепим и замораживаем ` +
        'в день производства. Готовим прямо из морозильника, без разморозки. ' +
        'Порция 800 г, срок хранения до 6 месяцев при -18°C.'
    );
}

// ─── Товары ───────────────────────────────────────────────────────────────────

export interface ProductDef {
    slug: string;
    name: string;
    categoryId: string;
    filling: string;
    /** Цена за 0.5 кг, рубли. */
    price500: number;
    /** Цена за 1 кг, рубли. */
    price1000: number;
}

/**
 * Товары каталога: по одному на каждую пару «категория × начинка».
 * Формула цены сохранена из прототипа, чтобы каталог совпадал с макетами.
 */
export function buildProducts(): ProductDef[] {
    const products: ProductDef[] = [];
    for (const cat of CATEGORIES) {
        if (cat.id === ADDON_CATEGORY_ID) continue;
        FILLINGS.forEach((filling, i) => {
            const price500 = 350 + ((i * 67) % 900);
            products.push({
                slug: `${cat.id}-${i}`,
                name: `${cat.name}, ${filling}`,
                categoryId: cat.id,
                filling,
                price500,
                price1000: Math.round((price500 * 1.85) / 10) * 10,
            });
        });
    }
    return products;
}

export interface AddonDef {
    id: string;
    name: string;
    price: number;
}

export const ADDONS: AddonDef[] = [
    { id: 'sauce_mushroom', name: 'Сливочно-грибной соус', price: 149 },
    { id: 'sauce_satsebeli', name: 'Сацебели', price: 129 },
    { id: 'sauce_smetana', name: 'Сметанно-чесночный соус', price: 99 },
    { id: 'sauce_tkemali', name: 'Ткемали', price: 139 },
    { id: 'ghee', name: 'Топлёное масло Гхи с розмарином', price: 129 },
    { id: 'green_butter', name: 'Зелёное масло', price: 119 },
    { id: 'cream_farm', name: 'Густые фермерские сливки 30%', price: 149 },
    { id: 'broth_beef', name: 'Бульонный концентрат говяжий', price: 89 },
    { id: 'broth_chicken', name: 'Бульонный концентрат куриный', price: 79 },
    { id: 'broth_mushroom', name: 'Бульонный концентрат грибной', price: 85 },
    { id: 'fried_onion', name: 'Хрустящий жареный лук', price: 89 },
    { id: 'shkvarki', name: 'Копчёные шкварки', price: 109 },
    { id: 'boil_salt', name: 'Ароматная соль для варки', price: 99 },
    { id: 'berry_coulis', name: 'Бруснично-вишнёвый кули', price: 119 },
    { id: 'caramel', name: 'Домашняя карамель', price: 99 },
];

/**
 * Раскладка дополнений по подкатегориям «Гастролавки»
 * (индексы соответствуют `CATEGORIES.find(c => c.id === 'gastrolavka').subs`).
 */
export const ADDON_SUBCATEGORY: Record<string, number> = {
    // Соусы
    sauce_mushroom: 0,
    sauce_satsebeli: 0,
    sauce_smetana: 0,
    sauce_tkemali: 0,
    // Масло и сливки
    ghee: 1,
    green_butter: 1,
    cream_farm: 1,
    // Бульоны
    broth_beef: 2,
    broth_chicken: 2,
    broth_mushroom: 2,
    // Топпинги
    fried_onion: 3,
    shkvarki: 3,
    boil_salt: 3,
    berry_coulis: 3,
    caramel: 3,
};

/** Какие дополнения предлагать в блоке «С чем подать?» для каждой категории. */
export const CATEGORY_ADDONS: Record<string, string[]> = {
    pelmeni: ['sauce_smetana', 'ghee', 'broth_beef', 'fried_onion', 'boil_salt'],
    vareniki_sweet: ['berry_coulis', 'caramel', 'cream_farm', 'sauce_smetana'],
    vareniki: ['fried_onion', 'sauce_smetana', 'sauce_mushroom', 'broth_mushroom'],
    manty: ['sauce_tkemali', 'ghee', 'broth_beef', 'boil_salt'],
    hinkali: ['green_butter', 'boil_salt', 'broth_beef', 'sauce_smetana'],
    khanum: ['sauce_satsebeli', 'sauce_smetana', 'broth_beef'],
    lapsha: ['broth_chicken', 'broth_beef', 'green_butter'],
};

/**
 * Сладкие вареники получают свой набор дополнений — к вишне и творогу
 * логичнее кули и карамель, а не жареный лук.
 */
export function getRelevantAddonIds(categoryId: string, productName = ''): string[] {
    const key =
        categoryId === 'vareniki' && /вишн|творог/i.test(productName) ? 'vareniki_sweet' : categoryId;
    return CATEGORY_ADDONS[key] ?? CATEGORY_ADDONS.pelmeni;
}

// ─── Группы опций (custom fields на OrderLine) ────────────────────────────────

export const WEIGHT_OPTIONS = [
    { id: '500', label: '0.5 кг', grams: 500 },
    { id: '1000', label: '1 кг', grams: 1000 },
] as const;

export const DOUGH_OPTIONS: OptionChoice[] = [
    { id: 'standard', label: 'Высший сорт', delta: 0, bju: { p: 0, f: 0, c: 0, k: 0 }, ingredient: 'мука пшеничная высшего сорта', hint: 'Классическое тесто на пшеничной муке высшего сорта.' },
    { id: 'polba', label: 'Полбяное', delta: 50, bju: { p: 2, f: 0, c: -4, k: -30 }, ingredient: 'полбяная мука', hint: '+50 ₽ — больше белка, меньше глютена, на 15% меньше калорий.' },
    { id: 'wholegrain', label: 'Цельнозерновое', delta: 30, bju: { p: 1, f: 0, c: 1, k: 5 }, ingredient: 'цельнозерновая пшеничная мука', hint: '+30 ₽ — грубый помол с оболочкой зерна, максимум клетчатки.' },
    { id: 'rye', label: 'Ржано-пшеничное', delta: 20, bju: { p: 1, f: 0, c: 2, k: 8 }, ingredient: 'ржано-пшеничная мука', hint: '+20 ₽ — плотное, чуть кисловатое тесто, отлично с дичью и грибами.' },
    { id: 'buckwheat', label: 'Гречневое', delta: 40, bju: { p: 3, f: 1, c: -2, k: 5 }, ingredient: 'гречневая мука (в замесе с пшеничной)', hint: '+40 ₽ — тёмный цвет, богато железом, благородный ореховый оттенок.' },
    { id: 'glutenfree', label: 'Безглютеновое', delta: 70, bju: { p: 2, f: 0, c: -2, k: -10 }, ingredient: 'рисовая и нутовая мука (без глютена)', hint: '+70 ₽ — рисовая и нутовая мука, без глютена, больше растительного белка.' },
];

export const FAT_OPTIONS: OptionChoice[] = [
    { id: 'broth', label: 'Бульон', delta: 0, bju: { p: 0, f: 0, c: 0, k: 0 }, ingredient: 'говяжий/бараний жир', hint: 'Насыщенный мясной сок и классический домашний аромат.' },
    { id: 'butter', label: 'Сливочное масло', delta: 0, bju: { p: 0, f: 3, c: 0, k: 25 }, ingredient: 'сливочное масло 82.5%', hint: 'Мягкий молочный вкус — хорошо подходит для детского меню.' },
    { id: 'olive', label: 'Оливковое масло', delta: 20, bju: { p: 0, f: 1, c: 0, k: 12 }, ingredient: 'оливковое масло Extra Virgin', hint: '+20 ₽ — лёгкий вкус без животных жиров, для контроля холестерина.' },
    { id: 'cream', label: 'Сливки 33%', delta: 15, bju: { p: 0, f: 4, c: 0, k: 35 }, ingredient: 'сливки 33%', hint: '+15 ₽ — мягкая сливочная сочность для нежного фарша из индейки или кролика.' },
];

export const COLOR_OPTIONS: OptionChoice[] = [
    { id: 'standard', label: 'Обычное', delta: 0, bju: { p: 0, f: 0, c: 0, k: 0 }, ingredient: '', hint: 'Натуральный цвет теста без добавок.' },
    { id: 'green', label: 'Зелёное', delta: 20, bju: { p: 0, f: 0, c: 0, k: 0 }, ingredient: 'сок шпината (краситель)', hint: '+20 ₽ — тесто на соке шпината: витамины и лёгкий детокс-эффект.' },
    { id: 'orange', label: 'Оранжевое', delta: 20, bju: { p: 0, f: 0, c: 0, k: 0 }, ingredient: 'куркума и морковный сок (краситель)', hint: '+20 ₽ — куркума и морковный сок: антиоксиданты и яркий цвет для детей.' },
    { id: 'black', label: 'Чёрное', delta: 30, bju: { p: 0, f: 0, c: 0, k: 0 }, ingredient: 'чернила каракатицы (краситель)', hint: '+30 ₽ — чернила каракатицы: премиальная подача к морепродуктам и рыбе.' },
];

export const TEXTURE_OPTIONS: OptionChoice[] = [
    { id: 'fine', label: 'Мелкий помол', delta: 0, bju: { p: 0, f: 0, c: 0, k: 0 }, ingredient: 'фарш мелкого помола', hint: 'Классический мягкий и привычный фарш.' },
    { id: 'chopped', label: 'Рубленое ножом', delta: 30, bju: { p: 0, f: 0, c: 0, k: 0 }, ingredient: 'рубленое ножом мясо', hint: '+30 ₽ — сочнее и текстурнее, с ощущением настоящего куска мяса.' },
];

/** Значения по умолчанию — совпадают с первым элементом каждой группы. */
export const DEFAULT_OPTIONS = {
    dough: 'standard',
    fat: 'broth',
    color: 'standard',
    texture: 'fine',
} as const;

export const OPTION_GROUPS = {
    dough: { code: 'dough', label: 'Тесто', choices: DOUGH_OPTIONS },
    fat: { code: 'fat', label: 'Сочность и жир', choices: FAT_OPTIONS },
    color: { code: 'color', label: 'Цвет теста', choices: COLOR_OPTIONS },
    texture: { code: 'texture', label: 'Текстура мяса', choices: TEXTURE_OPTIONS },
} as const;

export type OptionGroupCode = keyof typeof OPTION_GROUPS;

/** Базовые БЖУ на 100 г по категориям. */
export const BASE_BJU: Record<string, { p: number; f: number; c: number; k: number }> = {
    pelmeni: { p: 11, f: 9, c: 24, k: 222 },
    vareniki: { p: 7, f: 6, c: 32, k: 212 },
    manty: { p: 10, f: 11, c: 22, k: 230 },
    hinkali: { p: 11, f: 10, c: 23, k: 226 },
    khanum: { p: 9, f: 8, c: 26, k: 216 },
    lapsha: { p: 9, f: 2, c: 58, k: 280 },
};

// ─── Наборы, отзывы и контент главной ─────────────────────────────────────────

export const BUNDLES = [
    { slug: 'bundle-degustatsiya', tag: 'Набор · Дегустация', title: 'Попробовать всё', meta: '4 вкуса · 2 кг', desc: 'Пельмени, вареники, манты и хинкали', price: 1990 },
    { slug: 'bundle-family', tag: 'Набор · Семейный', title: 'Ужин на неделю', meta: '6 порций · 3 кг', desc: 'Пельмени, вареники, манты и лапша', price: 3490 },
    { slug: 'bundle-lean', tag: 'Набор · Постный', title: 'Постное меню', meta: '4 вкуса · 2 кг', desc: 'Вареники, манты с тыквой, лапша и хинкали с грибами', price: 2190 },
];

export const STEPS = [
    { num: 1, title: 'Продукты', desc: 'Отбираем свежее мясо, овощи и муку у проверенных поставщиков.' },
    { num: 2, title: 'Лепка', desc: 'Лепим вручную небольшими партиями в день производства.' },
    { num: 3, title: 'Заморозка', desc: 'Шоковая заморозка сразу после лепки сохраняет вкус и форму.' },
    { num: 4, title: 'Контроль качества', desc: 'Каждую партию проверяем перед упаковкой и отправкой.' },
];

/**
 * Тексты переписаны относительно прототипа: там оставались обещания доставки
 * «за 1–2 часа» и единый порог 3 000 ₽ от прежней модели «по требованию».
 * Фактическая модель — плановая доставка по зонам, у каждой свой порог
 * (см. `DELIVERY_ZONES`), поэтому копирайт приведён в соответствие.
 */
export const OFFERS = [
    {
        tag: 'Доставка и оплата',
        title: 'Бесплатно от 2 500 ₽',
        desc: 'Возим по расписанию в термосумке с хладоэлементами. Порог бесплатной доставки зависит от зоны — покажем его при оформлении. Оплата онлайн: СБП или картой.',
    },
    {
        tag: 'Гарантия вкуса',
        title: '100% гарантия вкуса',
        desc: 'Не понравился вкус — вернём деньги за товар или бесплатно заменим его в следующем заказе.',
    },
];

export const FAQS = [
    { q: 'Нужно ли размораживать перед готовкой?', a: 'Нет, всё готовится сразу из морозильника — без предварительной разморозки.' },
    { q: 'Сколько хранится продукция?', a: 'До 6 месяцев при температуре -18°C в морозильной камере.' },
    { q: 'Есть ли варианты без глютена или мяса?', a: 'Да, ищите отметки «Постные» и «Вегетарианские» в подкатегориях.' },
    {
        q: 'Когда приедет заказ?',
        a: 'Мы возим по расписанию: у каждой зоны свои дни и интервал доставки. При оформлении покажем ближайший рейс и срок, до которого нужно успеть оформить заказ, — или предложим выбрать другую дату.',
    },
];

export const REVIEWS: Record<string, Array<{ name: string; rating: string; text: string }>> = {
    pelmeni: [
        { name: 'Ирина', rating: '4.9', text: 'Пельмени как у бабушки — тесто тонкое, мяса много. Готовятся правда за 7 минут.' },
        { name: 'Дмитрий', rating: '4.8', text: 'Пробовал классику и с курицей — не разваливаются при варке, начинка сочная.' },
        { name: 'Анна', rating: '5.0', text: 'Детский вариант берём постоянно, порции маленькие и без специй.' },
    ],
    vareniki: [
        { name: 'Светлана', rating: '4.9', text: 'Вареники с вишней — обалденные, тесто мягкое даже после заморозки.' },
        { name: 'Павел', rating: '4.7', text: 'С картофелем очень домашние на вкус, дети едят с удовольствием.' },
        { name: 'Марина', rating: '4.8', text: 'С творогом в меру сладкие, не разваливаются при жарке на сковороде.' },
    ],
    manty: [
        { name: 'Азамат', rating: '4.9', text: 'Манты крупные, сочные — бульон внутри держится, как в хорошей чайхане.' },
        { name: 'Ольга', rating: '4.8', text: 'С тыквой неожиданно вкусно, готовятся на пару ровно 25 минут.' },
        { name: 'Роман', rating: '4.7', text: 'Тесто плотное, не расползается, лепка чувствуется — не фабричные.' },
    ],
    hinkali: [
        { name: 'Гиорги', rating: '5.0', text: 'Бульон внутри не вытекает при варке — редкость для заморозки.' },
        { name: 'Наталья', rating: '4.8', text: 'С сыром — отдельная песня, тесто держит форму идеально.' },
        { name: 'Илья', rating: '4.7', text: 'Хвостик плотный, есть руками удобно, как в грузинской кухне и должно быть.' },
    ],
    khanum: [
        { name: 'Тимур', rating: '4.8', text: 'Ханум с мясом готовим на пару всей семьёй, рулеты не разваливаются.' },
        { name: 'Юлия', rating: '4.7', text: 'Вегетарианский вариант неожиданно сытный и ароматный.' },
        { name: 'Алексей', rating: '4.9', text: 'С картофелем — как у тёщи, тесто тонкое и мягкое.' },
    ],
    lapsha: [
        { name: 'Ксения', rating: '4.8', text: 'Домашняя лапша держит форму в супе, не разваривается.' },
        { name: 'Артём', rating: '4.7', text: 'Гречневая — отличная альтернатива обычной, вкус насыщенный.' },
        { name: 'Полина', rating: '4.9', text: 'Рисовая лапша быстро готовится, идеальна для азиатских блюд.' },
    ],
};

// ─── Промокоды ────────────────────────────────────────────────────────────────

export const PROMO_CODES = [
    { code: 'FROST10', name: 'Скидка 10%', type: 'percent' as const, value: 10 },
    { code: 'WELCOME300', name: 'Скидка 300 ₽ на первый заказ', type: 'fixed' as const, value: 300 },
];
