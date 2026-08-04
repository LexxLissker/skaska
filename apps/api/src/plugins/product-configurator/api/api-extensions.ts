import gql from 'graphql-tag';

/**
 * Витрине нужен справочник опций (подписи, подсказки, наценки, поправки к БЖУ),
 * чтобы не дублировать его у себя в коде. Дублирование — прямой путь к тому,
 * что цена на карточке разойдётся с ценой в заказе.
 */
export const shopApiExtensions = gql`
    type ConfiguratorBju {
        protein: Float!
        fat: Float!
        carbs: Float!
        kcal: Float!
    }

    type ConfiguratorChoice {
        id: String!
        label: String!
        "Наценка в минорных единицах (копейках)"
        delta: Int!
        hint: String!
        bju: ConfiguratorBju!
    }

    type ConfiguratorGroup {
        code: String!
        label: String!
        choices: [ConfiguratorChoice!]!
    }

    type ConfiguratorAddon {
        id: String!
        name: String!
        "Цена в минорных единицах (копейках)"
        price: Int!
        productVariantId: ID
    }

    type ProductConfigurator {
        groups: [ConfiguratorGroup!]!
        "Базовые БЖУ на 100 г для категории товара"
        baseBju: ConfiguratorBju
        "Дополнения для блока «С чем подать?»"
        addons: [ConfiguratorAddon!]!
    }

    extend type Query {
        """
        Справочник опций конфигуратора. Если передан productId — вернёт также
        базовые БЖУ категории и релевантные дополнения для этого товара.
        """
        productConfigurator(productId: ID): ProductConfigurator!
    }
`;
