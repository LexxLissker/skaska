import {
    dummyPaymentHandler,
    DefaultJobQueuePlugin,
    DefaultSchedulerPlugin,
    DefaultSearchPlugin,
    VendureConfig,
    LanguageCode,
} from '@vendure/core';
import { defaultEmailHandlers, EmailPlugin, FileBasedTemplateLoader } from '@vendure/email-plugin';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import 'dotenv/config';
import path from 'path';

import { ProductConfiguratorPlugin } from './plugins/product-configurator/product-configurator.plugin';
import { ScheduledDeliveryPlugin } from './plugins/scheduled-delivery/scheduled-delivery.plugin';
import { mockSbpPaymentHandler } from './plugins/payment/mock-sbp-payment-handler';

const IS_DEV = process.env.APP_ENV === 'dev';
const serverPort = +(process.env.PORT || 3000);

export const config: VendureConfig = {
    apiOptions: {
        port: serverPort,
        adminApiPath: 'admin-api',
        shopApiPath: 'shop-api',
        // Playground и debug-инструменты — только в дев-сборке.
        ...(IS_DEV
            ? {
                  adminApiPlayground: { settings: { 'request.credentials': 'include' } },
                  adminApiDebug: true,
                  shopApiPlayground: { settings: { 'request.credentials': 'include' } },
                  shopApiDebug: true,
              }
            : {}),
        cors: {
            origin: (process.env.CORS_ORIGIN || 'http://localhost:3001').split(','),
            credentials: true,
        },
    },
    authOptions: {
        tokenMethod: ['bearer', 'cookie'],
        superadminCredentials: {
            identifier: process.env.SUPERADMIN_USERNAME || 'superadmin',
            password: process.env.SUPERADMIN_PASSWORD || 'superadmin',
        },
        cookieOptions: {
            secret: process.env.COOKIE_SECRET || 'zamorozka-dev-cookie-secret',
        },
    },
    dbConnectionOptions: {
        type: 'postgres',
        // Синхронизацию схемы держим только в деве; в проде — миграции.
        synchronize: IS_DEV,
        migrations: [path.join(__dirname, './migrations/*.+(js|ts)')],
        logging: false,
        host: process.env.DB_HOST || 'localhost',
        port: +(process.env.DB_PORT || 5432),
        username: process.env.DB_USERNAME || 'vendure',
        password: process.env.DB_PASSWORD || 'vendure',
        database: process.env.DB_NAME || 'zamorozka',
        schema: process.env.DB_SCHEMA || 'public',
    },
    paymentOptions: {
        paymentMethodHandlers: [mockSbpPaymentHandler, dummyPaymentHandler],
    },
    // Русская локаль по умолчанию — весь контент магазина на русском.
    defaultLanguageCode: LanguageCode.ru,
    customFields: {},
    plugins: [
        ProductConfiguratorPlugin,
        ScheduledDeliveryPlugin.init({
            // На MVP зона определяется по таблице адресов, как в прототипе.
            // Точка подмены на DaData/Яндекс.Геокодер — стратегия внутри плагина.
            addressLookup: 'table',
        }),
        AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path.join(__dirname, '../static/assets'),
            assetUrlPrefix: process.env.ASSET_URL_PREFIX || undefined,
        }),
        DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
        DefaultSchedulerPlugin.init({}),
        DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
        EmailPlugin.init({
            devMode: true,
            outputPath: path.join(__dirname, '../static/email/test-emails'),
            route: 'mailbox',
            handlers: defaultEmailHandlers,
            // Шаблоны лежат вне static/: static/ — это загруженные файлы, он в git не попадает,
            // а шаблоны писем правятся под магазин и должны версионироваться.
            templateLoader: new FileBasedTemplateLoader(path.join(__dirname, '../email-templates')),
            globalTemplateVars: {
                fromAddress: '"Заморозка" <noreply@zamorozka.local>',
                verifyEmailAddressUrl: `${process.env.STOREFRONT_URL || 'http://localhost:3001'}/verify`,
                passwordResetUrl: `${process.env.STOREFRONT_URL || 'http://localhost:3001'}/password-reset`,
                changeEmailAddressUrl: `${process.env.STOREFRONT_URL || 'http://localhost:3001'}/verify-email-address-change`,
            },
        }),
        AdminUiPlugin.init({
            route: 'admin',
            port: serverPort + 2,
            adminUiConfig: {
                // Админка открывается через тот же публичный адрес, что и витрина.
                // Жёсткий порт 3000 заставлял браузер обходить Caddy и обращаться
                // к закрытому внутреннему порту сервера напрямую.
                apiHost: 'auto',
                apiPort: 'auto',
                adminApiPath: 'admin-api',
                defaultLanguage: LanguageCode.ru,
                availableLanguages: [LanguageCode.ru, LanguageCode.en],
            },
        }),
    ],
};
