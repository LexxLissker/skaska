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

export const demoCategories: Category[] = [
    {
        id: 'demo-pelmeni',
        name: 'Пельмени',
        slug: 'pelmeni',
        description: 'Пельмени ручной лепки из охлаждённого мяса. Замораживаем в день лепки — готовим 7 минут, без разморозки.',
        assetUrl: null,
        children: [
            { id: 'demo-pelmeni-classic', name: 'Классика', slug: 'pelmeni-classic', description: 'Классические пельмени ручной лепки с мясными начинками: тонкое тесто, сочный фарш и насыщенный бульон внутри. Варятся прямо из морозильника за 7 минут.', assetUrl: null },
            { id: 'demo-pelmeni-bird', name: 'Птица', slug: 'pelmeni-bird', description: 'Пельмени ручной лепки с курицей и индейкой — более лёгкий вариант с нежной начинкой и тонким тестом. Подходят для быстрого семейного ужина.', assetUrl: null },
            { id: 'demo-pelmeni-lean', name: 'Рыба/Постное', slug: 'pelmeni-lean', description: 'Пельмени с рыбными и постными начинками для разнообразного домашнего меню. Лепим небольшими партиями и замораживаем сразу после лепки.', assetUrl: null },
        ],
    },
    {
        id: 'demo-vareniki',
        name: 'Вареники',
        slug: 'vareniki',
        description: 'Тонкое тесто и щедрая начинка — для уютного завтрака, обеда или десерта.',
        assetUrl: null,
        children: [
            { id: 'demo-vareniki-potato', name: 'С картофелем', slug: 'vareniki-potato', description: 'Домашние вареники с картофелем и жареным луком в тонком тесте. Сытный вариант для обеда или ужина, который можно сварить прямо из морозильника.', assetUrl: null },
            { id: 'demo-vareniki-curd', name: 'С творогом', slug: 'vareniki-curd', description: 'Вареники с нежной творожной начинкой и тонким домашним тестом. Подавайте со сметаной, сливочным маслом или ягодным соусом.', assetUrl: null },
            { id: 'demo-vareniki-cherry', name: 'С вишней', slug: 'vareniki-cherry', description: 'Сладкие вареники с сочной вишнёвой начинкой и тонким тестом. Быстрый десерт или завтрак со сливками, сметаной либо ягодным кули.', assetUrl: null },
        ],
    },
    {
        id: 'demo-manty',
        name: 'Манты',
        slug: 'manty',
        description: 'Сочные манты с тонким тестом и ароматной начинкой.',
        assetUrl: null,
        children: [
            { id: 'demo-manty-classic', name: 'Говядина/баранина', slug: 'manty-classic', description: 'Крупные манты с рубленой говядиной и бараниной, луком и ароматными специями. Готовятся на пару, сохраняя мясной сок внутри.', assetUrl: null },
            { id: 'demo-manty-pumpkin', name: 'Тыква', slug: 'manty-pumpkin', description: 'Манты с тыквой и луком — ароматная овощная начинка в тонком тесте. Подойдут для лёгкого домашнего обеда или ужина.', assetUrl: null },
            { id: 'demo-manty-bird', name: 'Курица', slug: 'manty-bird', description: 'Манты с курицей: нежная начинка, лук и сбалансированные специи в тонком тесте. Готовятся на пару прямо из замороженного состояния.', assetUrl: null },
        ],
    },
    {
        id: 'demo-hinkali',
        name: 'Хинкали',
        slug: 'hinkali',
        description: 'Крупные хинкали с бульоном внутри — готовятся из замороженного состояния.',
        assetUrl: null,
        children: [
            { id: 'demo-hinkali-classic', name: 'Классика', slug: 'hinkali-classic', description: 'Классические хинкали с мясной начинкой, зеленью и бульоном внутри. Плотное тесто сохраняет форму и сочность во время варки.', assetUrl: null },
            { id: 'demo-hinkali-cheese', name: 'Сыр', slug: 'hinkali-cheese', description: 'Хинкали с сырной начинкой — мягкий сливочный вкус и упругое тесто. Самостоятельное блюдо, которое удобно приготовить прямо из морозильника.', assetUrl: null },
            { id: 'demo-hinkali-mushroom', name: 'Грибы', slug: 'hinkali-mushroom', description: 'Хинкали с грибами и ароматными специями в плотном тесте. Сочный вариант без мясной начинки для домашнего обеда или ужина.', assetUrl: null },
        ],
    },
    {
        id: 'demo-khanum',
        name: 'Ханум',
        slug: 'khanum',
        description: 'Рулеты из тонкого теста с мясной или овощной начинкой, приготовленные на пару.',
        assetUrl: null,
        children: [
            { id: 'demo-khanum-meat', name: 'С мясом', slug: 'khanum-meat', description: 'Ханум с мясом — рулет из тонкого теста с рубленой начинкой, луком и специями. Сочный и сытный вариант семейного ужина, приготовленный на пару.', assetUrl: null },
            { id: 'demo-khanum-potato', name: 'С картофелем', slug: 'khanum-potato', description: 'Ханум с картофелем и луком: мягкая овощная начинка, специи и тонкое тесто. Готовится на пару и хорошо сочетается со сметанным соусом.', assetUrl: null },
            { id: 'demo-khanum-vegetable', name: 'Вегетарианские', slug: 'khanum-vegetable', description: 'Вегетарианский ханум с овощами, луком и специями в тонком тесте. Лёгкое, но сытное блюдо для приготовления на пару.', assetUrl: null },
        ],
    },
    {
        id: 'demo-lapsha',
        name: 'Лапша',
        slug: 'lapsha',
        description: 'Домашняя лапша быстро готовится и держит форму при варке.',
        assetUrl: null,
        children: [
            { id: 'demo-lapsha-home', name: 'Домашняя', slug: 'lapsha-home', description: 'Домашняя пшеничная лапша с ровной текстурой и хорошей упругостью. Подходит для супов, бульонов и горячих блюд, быстро варится и держит форму.', assetUrl: null },
            { id: 'demo-lapsha-buckwheat', name: 'Гречневая', slug: 'lapsha-buckwheat', description: 'Гречневая лапша с выразительным ореховым вкусом. Подходит для горячих блюд с овощами, мясом или грибами и не теряет форму при варке.', assetUrl: null },
            { id: 'demo-lapsha-rice', name: 'Рисовая', slug: 'lapsha-rice', description: 'Рисовая лапша для супов, воков и лёгких горячих блюд. Быстро готовится и хорошо сочетается с овощами, птицей, морепродуктами и соусами.', assetUrl: null },
        ],
    },
    {
        id: 'demo-gastrolavka',
        name: 'Гастролавка',
        slug: 'gastrolavka',
        description: 'Соусы, масло, бульонные концентраты и топпинги для домашней подачи.',
        assetUrl: null,
        children: [
            { id: 'demo-gastrolavka-sauces', name: 'Соусы', slug: 'gastrolavka-sauces', description: 'Соусы к пельменям, вареникам, мантам и другим домашним блюдам: от сметанно-чесночного до сацебели и ткемали. Добавьте к заказу готовую подачу.', assetUrl: null },
            { id: 'demo-gastrolavka-butter', name: 'Масло и сливки', slug: 'gastrolavka-butter', description: 'Топлёное и зелёное масло, а также густые сливки для подачи горячих блюд. Дополняют мясные, овощные и сладкие начинки.', assetUrl: null },
            { id: 'demo-gastrolavka-broths', name: 'Бульоны', slug: 'gastrolavka-broths', description: 'Концентрированные говяжьи, куриные и грибные бульоны для варки и подачи. Помогают быстро сделать вкус блюда насыщеннее.', assetUrl: null },
            { id: 'demo-gastrolavka-toppings', name: 'Топпинги', slug: 'gastrolavka-toppings', description: 'Хрустящий жареный лук, копчёные шкварки, ароматная соль и сладкие топпинги. Небольшие дополнения, которые меняют вкус и подачу блюда.', assetUrl: null },
        ],
    },
];

const demoAddons = [
    { id: 'sauce-mushroom', name: 'Сливочно-грибной соус', price: 14900 },
    { id: 'sauce-satsebeli', name: 'Сацебели', price: 12900 },
    { id: 'sauce-smetana', name: 'Сметанно-чесночный соус', price: 9900 },
    { id: 'sauce-tkemali', name: 'Ткемали', price: 13900 },
    { id: 'ghee', name: 'Топлёное масло Гхи с розмарином', price: 12900 },
    { id: 'green-butter', name: 'Зелёное масло', price: 11900 },
    { id: 'cream-farm', name: 'Густые фермерские сливки 30%', price: 14900 },
    { id: 'broth-beef', name: 'Бульонный концентрат говяжий', price: 8900 },
    { id: 'broth-chicken', name: 'Бульонный концентрат куриный', price: 7900 },
    { id: 'broth-mushroom', name: 'Бульонный концентрат грибной', price: 8500 },
    { id: 'fried-onion', name: 'Хрустящий жареный лук', price: 8900 },
    { id: 'shkvarki', name: 'Копчёные шкварки', price: 10900 },
    { id: 'boil-salt', name: 'Ароматная соль для варки', price: 9900 },
    { id: 'berry-coulis', name: 'Бруснично-вишнёвый кули', price: 11900 },
    { id: 'caramel', name: 'Домашняя карамель', price: 9900 },
] as const;

function collectionCategory(slug: string): Category {
    return demoCategories.find(category => category.slug === slug || category.children.some(child => child.slug === slug)) ?? demoCategories[0];
}

export function demoProducts(collectionSlug: string): ProductCard[] {
    const category = collectionCategory(collectionSlug);
    if (category.slug === 'gastrolavka') {
        return demoAddons.map(addon => ({
            id: `demo-addon-${addon.id}`,
            name: addon.name,
            slug: `gastrolavka-${addon.id}`,
            assetUrl: null,
            prices: { '500': addon.price, '1000': addon.price },
            variantIds: { '500': `demo-addon-${addon.id}`, '1000': `demo-addon-${addon.id}` },
            isAddon: true,
        }));
    }
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
    const category = demoCategories.find(item => slug.startsWith(`${item.slug}-`)) ?? demoCategories[0];
    const variants = product.isAddon
        ? [{ id: product.variantIds['500'], name: '1 шт.', price: product.prices['500'], weight: '500' }]
        : [
            { id: product.variantIds['500'], name: '500 г', price: product.prices['500'], weight: '500' },
            { id: product.variantIds['1000'], name: '1000 г', price: product.prices['1000'], weight: '1000' },
        ];
    return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: 'Замороженный полуфабрикат ручной лепки. Готовить из морозильника, без разморозки.',
        assetUrl: null,
        categoryCode: category.slug,
        variants,
    };
}

export function demoProductByVariant(variantId: string) {
    for (const category of demoCategories) {
        for (const product of demoProducts(category.slug)) {
            const weight = product.variantIds['1000'] === variantId ? '1000' : '500';
            if (product.variantIds[weight] === variantId) return { product, weight } as const;
        }
    }
    return null;
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
        { id: 'demo-sauce', name: 'Сметанно-чесночный соус', price: 9900, productVariantId: 'demo-addon-sauce-smetana' },
        { id: 'demo-ghee', name: 'Топлёное масло с розмарином', price: 12900, productVariantId: 'demo-addon-ghee' },
        { id: 'demo-broth', name: 'Бульонный концентрат', price: 8900, productVariantId: 'demo-addon-broth-beef' },
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
