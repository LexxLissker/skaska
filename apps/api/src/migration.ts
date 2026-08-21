import { generateMigration, revertLastMigration, runMigrations } from '@vendure/core';

import { config } from './vendure-config';

/**
 * Управление миграциями схемы.
 *
 *   npm run migration:generate --workspace=@zamorozka/api -- НазваниеМиграции
 *   npm run migration:run     --workspace=@zamorozka/api
 *   npm run migration:revert  --workspace=@zamorozka/api
 *
 * Генерировать нужно на ПУСТОЙ базе — TypeORM сравнивает сущности с текущей
 * схемой, и против уже синхронизированной базы получится пустая миграция.
 */
const [, , command, name] = process.argv;

async function main(): Promise<void> {
    switch (command) {
        case 'generate':
            await generateMigration(config, {
                name: name || 'migration',
                outputDir: `${__dirname}/migrations`,
            });
            break;
        case 'run':
            console.log(await runMigrations(config));
            break;
        case 'revert':
            await revertLastMigration(config);
            break;
        default:
            console.error('Использование: migration.ts generate|run|revert [название]');
            process.exit(1);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
