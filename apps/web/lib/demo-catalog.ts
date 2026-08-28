import type { BundleOffer, Category, ConfiguratorData, ProductCard, ProductDetail } from './api/catalog';
import type { Cart } from './api/cart';

/**
 * Локальная витрина нужна для согласования фронтенда до запуска Vendure.
 * На боевом сервере развёртывание всегда выставляет NEXT_PUBLIC_USE_VENDURE=true.
 */
export const isDemoStorefront = process.env.NEXT_PUBLIC_USE_VENDURE !== 'true';

const fillings = [
    'Говядина/свинина',
    'Курица и индейка',
    'Телятина',
    'С грибами',
    'Со шпинатом и сыром',
    'Бабушкин рецепт',
] as const;

export const demoCategories: Category[] = [
    {
        id: 'demo-pelmeni',
        name: 'Пельмени',
        slug: 'pelmeni',
        description: 'Пельмени ручной лепки из охлаждённого мяса. Замораживаем в день лепки — готовим 7 минут, без разморозки.',
        assetUrl: null,
        children: [
            { id: 'demo-pelmeni-classic', name: 'Классика', slug: 'pelmeni-classic', description: 'Классические пельмени ручной лепки: тонкое тесто, сочная начинка и домашний вкус.' },
            { id: 'demo-pelmeni-bird', name: 'Птица', slug: 'pelmeni-bird', description: 'Нежная птица и тонкое тесто для лёгкого домашнего ужина.' },
            { id: 'demo-pelmeni-lean', name: 'Рыба/Постное', slug: 'pelmeni-lean', description: 'Постные и рыбные варианты для разнообразного меню.' },
        ],
    },
    {
        id: 'demo-vareniki',
        name: 'Вареники',
        slug: 'vareniki',
        description: 'Тонкое тесто и щедрая начинка — для уютного завтрака, обеда или десерта.',
        assetUrl: null,
        children: [
            { id: 'demo-vareniki-curd', name: 'С творогом', slug: 'vareniki-curd', description: 'Нежный творог и тонкое домашнее тесто.' },
            { id: 'demo-vareniki-potato', name: 'С картофелем', slug: 'vareniki-potato', description: 'Картофель, жареный лук и домашнее тесто.' },
            { id: 'demo-vareniki-cherry', name: 'С вишней', slug: 'vareniki-cherry', description: 'Сочная вишнёвая начинка для сладкого ужина.' },
        ],
    },
    {
        id: 'demo-manty',
        name: 'Манты',
        slug: 'manty',
        description: 'Сочные манты с тонким тестом и ароматной начинкой.',
        assetUrl: null,
        children: [
            { id: 'demo-manty-classic', name: 'Классика', slug: 'manty-classic', description: 'Манты с рубленым мясом и пряным бульоном.' },
            { id: 'demo-manty-bird', name: 'Птица', slug: 'manty-bird', description: 'Нежная птица, овощи и тонкое тесто.' },
            { id: 'demo-manty-vegetable', name: 'Овощные', slug: 'manty-vegetable', description: 'Овощная начинка для лёгкого ужина.' },
        ],
    },
    {
        id: 'demo-hinkali',
        name: 'Хинкали',
        slug: 'hinkali',
        description: 'Крупные хинкали с бульоном внутри — готовятся из замороженного состояния.',
        assetUrl: null,
        children: [
            { id: 'demo-hinkali-classic', name: 'Классика', slug: 'hinkali-classic', description: 'Хинкали с сочной мясной начинкой и бульоном внутри.' },
            { id: 'demo-hinkali-cheese', name: 'Сыр', slug: 'hinkali-cheese', description: 'Нежная сырная начинка и плотное тесто.' },
            { id: 'demo-hinkali-mushroom', name: 'Грибы', slug: 'hinkali-mushroom', description: 'Ароматные грибы и домашнее тесто.' },
        ],
    },
];

function collectionCategory(slug: string): Category {
    return demoCategories.find(category => category.slug === slug || category.children.some(child => child.slug === slug)) ?? demoCategories[0];
}

export function demoProducts(collectionSlug: string): ProductCard[] {
    const category = collectionCategory(collectionSlug);
    return fillings.map((filling, index) => {
        const price500 = 350 + ((index * 67) % 900);
        return {
            id: `demo-${category.slug}-${index}`,
            name: `${category.name}, ${filling}`,
            slug: `${category.slug}-${index}`,
            assetUrl: null,
            prices: { '500': price500 * 100, '1000': Math.round((price500 * 1.85) / 10) * 1000 },
            variantIds: { '500': `demo-${category.slug}-${index}-500`, '1000': `demo-${category.slug}-${index}-1000` },
        };
    });
}

export function demoProduct(slug: string): ProductDetail | null {
    const product = demoCategories.flatMap(category => demoProducts(category.slug)).find(item => item.slug === slug);
    if (!product) return null;
    const category = collectionCategory(slug.split('-').slice(0, -1).join('-'));
    return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: 'Замороженный полуфабрикат ручной лепки. Готовить из морозильника, без разморозки.',
        assetUrl: null,
        categoryCode: category.slug,
        variants: [
            { id: product.variantIds['500'], name: '500 г', price: product.prices['500'], weight: '500' },
            { id: product.variantIds['1000'], name: '1000 г', price: product.prices['1000'], weight: '1000' },
        ],
    };
}

const choice = (id: string, label: string, delta: number, hint: string, ingredient: string, bju = { protein: 0, fat: 0, carbs: 0, kcal: 0 }) => ({ id, label, delta: delta * 100, hint, ingredient, bju });

export const demoConfigurator: ConfiguratorData = {
    baseBju: { protein: 11, fat: 9, carbs: 24, kcal: 222 },
    groups: [
        { code: 'dough', label: 'Тесто', choices: [choice('standard', 'Высший сорт', 0, 'Классическое тесто на пшеничной муке высшего сорта.', 'мука пшеничная высшего сорта'), choice('polba', 'Полбяное', 50, 'Больше белка и меньше глютена.', 'полбяная мука'), choice('wholegrain', 'Цельнозерновое', 30, 'Грубый помол с оболочкой зерна.', 'цельнозерновая пшеничная мука')] },
        { code: 'fat', label: 'Сочность и жир', choices: [choice('broth', 'Бульон', 0, 'Насыщенный мясной сок и домашний аромат.', 'говяжий жир'), choice('butter', 'Сливочное масло', 0, 'Мягкий молочный вкус.', 'сливочное масло'), choice('olive', 'Оливковое масло', 20, 'Лёгкий вкус без животных жиров.', 'оливковое масло')] },
        { code: 'color', label: 'Цвет теста', choices: [choice('standard', 'Обычное', 0, 'Натуральный цвет теста без добавок.', ''), choice('green', 'Зелёное', 20, 'Тесто на соке шпината.', 'сок шпината'), choice('orange', 'Оранжевое', 20, 'Тесто с куркумой и морковным соком.', 'куркума')] },
        { code: 'texture', label: 'Текстура мяса', choices: [choice('fine', 'Мелкий помол', 0, 'Классический мягкий фарш.', 'фарш мелкого помола'), choice('chopped', 'Рубленое ножом', 30, 'Сочнее и текстурнее.', 'рубленое ножом мясо')] },
    ],
    addons: [
        { id: 'demo-sauce', name: 'Сметанно-чесночный соус', price: 9900, productVariantId: 'demo-sauce' },
        { id: 'demo-ghee', name: 'Топлёное масло с розмарином', price: 12900, productVariantId: 'demo-ghee' },
        { id: 'demo-broth', name: 'Бульонный концентрат', price: 8900, productVariantId: 'demo-broth' },
    ],
};

export const demoBundles: BundleOffer[] = [
    { slug: 'bundle-degustatsiya', assetUrl: null, price: 199000, variantId: 'demo-bundle-tasting' },
    { slug: 'bundle-family', assetUrl: null, price: 349000, variantId: 'demo-bundle-family' },
    { slug: 'bundle-lean', assetUrl: null, price: 219000, variantId: 'demo-bundle-lean' },
];

export function demoSearch(term: string) {
    const normalized = term.trim().toLowerCase();
    return demoCategories.flatMap(category => demoProducts(category.slug))
        .filter(product => product.name.toLowerCase().includes(normalized))
        .slice(0, 8)
        .map(product => ({ name: product.name, slug: product.slug, price: product.prices['500'] }));
}

/**
 * Наполненная корзина существует только как запасной вариант для локального
 * просмотра без Shop API. Как только Vendure отвечает, используется его заказ.
 */
export const demoCart: Cart = {
    id: 'demo-order',
    code: 'DEMO',
    state: 'AddingItems',
    totalQuantity: 5,
    subTotal: 221800,
    shipping: 0,
    total: 221800,
    couponCodes: [],
    discounts: [],
    customer: null,
    shippingAddress: { streetLine1: null },
    lines: [
        {
            id: 'demo-line-1', quantity: 1, unitPrice: 69000, linePrice: 69000,
            productName: 'Пельмени «Классические»', productSlug: 'pelmeni-0',
            variantName: '1 кг', weight: '1 кг', assetUrl: null, variantLabel: 'Стандарт', options: {},
        },
        {
            id: 'demo-line-2', quantity: 1, unitPrice: 38000, linePrice: 38000,
            productName: 'Вареники с творогом', productSlug: 'vareniki-0',
            variantName: '0.5 кг', weight: '0.5 кг', assetUrl: null, variantLabel: 'Стандарт', options: {},
        },
        {
            id: 'demo-line-3', quantity: 1, unitPrice: 44800, linePrice: 44800,
            productName: 'Хинкали, классика', productSlug: 'hinkali-0',
            variantName: '0.5 кг', weight: '0.5 кг', assetUrl: null, variantLabel: 'Стандарт', options: {},
        },
        {
            id: 'demo-line-4', quantity: 1, unitPrice: 35000, linePrice: 35000,
            productName: 'Пельмени, Говядина/свинина', productSlug: 'pelmeni-0',
            variantName: '0.5 кг', weight: '0.5 кг', assetUrl: null, variantLabel: 'Стандарт', options: {},
        },
        {
            id: 'demo-line-5', quantity: 1, unitPrice: 35000, linePrice: 35000,
            productName: 'Пельмени, Говядина/свинина', productSlug: 'pelmeni-0',
            variantName: '0.5 кг', weight: '0.5 кг', assetUrl: null, variantLabel: 'Стандарт', options: {},
        },
    ],
};
