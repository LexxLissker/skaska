import { MigrationInterface, QueryRunner } from 'typeorm';

interface DescriptionUpdate {
    slug: string;
    categoryName: string;
    subcategoryName: string;
    description: string;
}

/**
 * Снимок SEO-текстов на момент миграции. Обновляем только старый шаблонный
 * текст (или пустое значение), поэтому ручные правки владельца не затрагиваем.
 */
const UPDATES: DescriptionUpdate[] = [
    { slug: 'pelmeni-klassika', categoryName: 'Пельмени', subcategoryName: 'Классика', description: 'Классические пельмени ручной лепки с мясными начинками: тонкое тесто, сочный фарш и насыщенный бульон внутри. Варятся прямо из морозильника за 7 минут.' },
    { slug: 'pelmeni-ptica', categoryName: 'Пельмени', subcategoryName: 'Птица', description: 'Пельмени ручной лепки с курицей и индейкой — более лёгкий вариант с нежной начинкой и тонким тестом. Подходят для быстрого семейного ужина.' },
    { slug: 'pelmeni-ryba-postnoe', categoryName: 'Пельмени', subcategoryName: 'Рыба/Постное', description: 'Пельмени с рыбными и постными начинками для разнообразного домашнего меню. Лепим небольшими партиями и замораживаем сразу после лепки.' },
    { slug: 'vareniki-s-kartofelem', categoryName: 'Вареники', subcategoryName: 'С картофелем', description: 'Домашние вареники с картофелем и жареным луком в тонком тесте. Сытный вариант для обеда или ужина, который можно сварить прямо из морозильника.' },
    { slug: 'vareniki-s-tvorogom', categoryName: 'Вареники', subcategoryName: 'С творогом', description: 'Вареники с нежной творожной начинкой и тонким домашним тестом. Подавайте со сметаной, сливочным маслом или ягодным соусом.' },
    { slug: 'vareniki-s-vishney', categoryName: 'Вареники', subcategoryName: 'С вишней', description: 'Сладкие вареники с сочной вишнёвой начинкой и тонким тестом. Быстрый десерт или завтрак со сливками, сметаной либо ягодным кули.' },
    { slug: 'manty-govyadina-baranina', categoryName: 'Манты', subcategoryName: 'Говядина/баранина', description: 'Крупные манты с рубленой говядиной и бараниной, луком и ароматными специями. Готовятся на пару, сохраняя мясной сок внутри.' },
    { slug: 'manty-tykva', categoryName: 'Манты', subcategoryName: 'Тыква', description: 'Манты с тыквой и луком — ароматная овощная начинка в тонком тесте. Подойдут для лёгкого домашнего обеда или ужина.' },
    { slug: 'manty-kurica', categoryName: 'Манты', subcategoryName: 'Курица', description: 'Манты с курицей: нежная начинка, лук и сбалансированные специи в тонком тесте. Готовятся на пару прямо из замороженного состояния.' },
    { slug: 'hinkali-klassika', categoryName: 'Хинкали', subcategoryName: 'Классика', description: 'Классические хинкали с мясной начинкой, зеленью и бульоном внутри. Плотное тесто сохраняет форму и сочность во время варки.' },
    { slug: 'hinkali-syr', categoryName: 'Хинкали', subcategoryName: 'Сыр', description: 'Хинкали с сырной начинкой — мягкий сливочный вкус и упругое тесто. Самостоятельное блюдо, которое удобно приготовить прямо из морозильника.' },
    { slug: 'hinkali-griby', categoryName: 'Хинкали', subcategoryName: 'Грибы', description: 'Хинкали с грибами и ароматными специями в плотном тесте. Сочный вариант без мясной начинки для домашнего обеда или ужина.' },
    { slug: 'khanum-s-myasom', categoryName: 'Ханум', subcategoryName: 'С мясом', description: 'Ханум с мясом — рулет из тонкого теста с рубленой начинкой, луком и специями. Сочный и сытный вариант семейного ужина, приготовленный на пару.' },
    { slug: 'khanum-s-kartofelem', categoryName: 'Ханум', subcategoryName: 'С картофелем', description: 'Ханум с картофелем и луком: мягкая овощная начинка, специи и тонкое тесто. Готовится на пару и хорошо сочетается со сметанным соусом.' },
    { slug: 'khanum-vegetarianskie', categoryName: 'Ханум', subcategoryName: 'Вегетарианские', description: 'Вегетарианский ханум с овощами, луком и специями в тонком тесте. Лёгкое, но сытное блюдо для приготовления на пару.' },
    { slug: 'lapsha-domashnyaya', categoryName: 'Лапша', subcategoryName: 'Домашняя', description: 'Домашняя пшеничная лапша с ровной текстурой и хорошей упругостью. Подходит для супов, бульонов и горячих блюд, быстро варится и держит форму.' },
    { slug: 'lapsha-grechnevaya', categoryName: 'Лапша', subcategoryName: 'Гречневая', description: 'Гречневая лапша с выразительным ореховым вкусом. Подходит для горячих блюд с овощами, мясом или грибами и не теряет форму при варке.' },
    { slug: 'lapsha-risovaya', categoryName: 'Лапша', subcategoryName: 'Рисовая', description: 'Рисовая лапша для супов, воков и лёгких горячих блюд. Быстро готовится и хорошо сочетается с овощами, птицей, морепродуктами и соусами.' },
    { slug: 'gastrolavka-sousy', categoryName: 'Гастролавка', subcategoryName: 'Соусы', description: 'Соусы к пельменям, вареникам, мантам и другим домашним блюдам: от сметанно-чесночного до сацебели и ткемали. Добавьте к заказу готовую подачу.' },
    { slug: 'gastrolavka-maslo-i-slivki', categoryName: 'Гастролавка', subcategoryName: 'Масло и сливки', description: 'Топлёное и зелёное масло, а также густые сливки для подачи горячих блюд. Дополняют мясные, овощные и сладкие начинки.' },
    { slug: 'gastrolavka-bulony', categoryName: 'Гастролавка', subcategoryName: 'Бульоны', description: 'Концентрированные говяжьи, куриные и грибные бульоны для варки и подачи. Помогают быстро сделать вкус блюда насыщеннее.' },
    { slug: 'gastrolavka-toppingi', categoryName: 'Гастролавка', subcategoryName: 'Топпинги', description: 'Хрустящий жареный лук, копчёные шкварки, ароматная соль и сладкие топпинги. Небольшие дополнения, которые меняют вкус и подачу блюда.' },
];

function legacyDescription(item: DescriptionUpdate): string {
    return (
        `${item.subcategoryName} — ${item.categoryName.toLowerCase()} ручной лепки, которые лепим и замораживаем ` +
        'в день производства. Готовим прямо из морозильника, без разморозки. ' +
        'Порция 800 г, срок хранения до 6 месяцев при -18°C.'
    );
}

export class UniqueCatalogDescriptions1788512400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const item of UPDATES) {
            await queryRunner.query(
                `UPDATE "collection_translation"
                 SET "description" = $1, "updatedAt" = now()
                 WHERE "slug" = $2 AND ("description" = $3 OR "description" = '')`,
                [item.description, item.slug, legacyDescription(item)],
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        for (const item of UPDATES) {
            await queryRunner.query(
                `UPDATE "collection_translation"
                 SET "description" = $1, "updatedAt" = now()
                 WHERE "slug" = $2 AND "description" = $3`,
                [legacyDescription(item), item.slug, item.description],
            );
        }
    }
}
