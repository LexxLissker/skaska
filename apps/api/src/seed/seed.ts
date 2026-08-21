import { INestApplicationContext } from '@nestjs/common';
import {
    bootstrapWorker,
    LanguageCode,
    ProductService,
    RequestContext,
    RequestContextService,
} from '@vendure/core';

import { config } from '../vendure-config';
import { seedCatalog } from './seed-catalog';
import { seedCommerce } from './seed-commerce';
import { seedDeliveryZones } from './seed-delivery';

/**
 * Наполняет пустую базу данными из дизайн-прототипа.
 *
 * Запуск: `npm run seed --workspace=@zamorozka/api`
 *
 * Скрипт не идемпотентен для каталога: если товары уже есть, он остановится,
 * чтобы не наплодить дубликаты. Коммерческая настройка и зоны доставки,
 * наоборот, обновляются при каждом запуске.
 */
async function run(): Promise<void> {
    console.log('Подключаюсь к Vendure…');

    // bootstrapWorker поднимает приложение без HTTP-сервера — для скрипта этого хватает.
    const worker = await bootstrapWorker(config);
    const app: INestApplicationContext = worker.app;

    const newContext = (): Promise<RequestContext> =>
        app.get(RequestContextService).create({ apiType: 'admin', languageCode: LanguageCode.ru });

    let ctx = await newContext();

    try {
        const existing = await app.get(ProductService).findAll(ctx, { take: 1 });
        if (existing.totalItems > 0) {
            console.log(
                `\nВ базе уже ${existing.totalItems} товаров — каталог пропускаю.\n` +
                    'Чтобы пересоздать с нуля: docker compose down -v && docker compose up -d db\n',
            );
            await seedCommerce(app, ctx);
            await seedDeliveryZones(app, ctx);
        } else {
            console.log('\nЗаполняю базу:');
            await seedCommerce(app, ctx);
            await seedDeliveryZones(app, ctx);

            // Контекст держит снимок канала, а seedCommerce только что прописала
            // каналу налоговую зону. Со старым снимком расчёт цены варианта
            // падает с no-active-tax-zone — берём свежий.
            ctx = await newContext();
            await seedCatalog(app, ctx);
        }

        console.log('\nГотово.\n');
    } finally {
        await app.close();
    }
}

run()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('\nСид упал:', err);
        process.exit(1);
    });
