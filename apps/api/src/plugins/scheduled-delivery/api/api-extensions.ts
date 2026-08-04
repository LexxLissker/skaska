import gql from 'graphql-tag';

/**
 * Витрине нужен один запрос, который по адресу отдаёт всё для блока «Доставка»:
 * зону, ближайшие рейсы, стоимость и остаток до бесплатной доставки.
 * Считать это на фронте нельзя — цена доставки должна приходить с сервера.
 */
export const shopApiExtensions = gql`
    type DeliveryAddressSuggestion {
        value: String!
    }

    type DeliveryRunOption {
        id: ID!
        "Дата рейса в ISO-формате"
        date: DateTime!
        "«вторник, 12 августа»"
        label: String!
        "«Вт, 12 августа» — для компактных пилюль выбора даты"
        shortLabel: String!
        "Интервал доставки, например «18:00–21:00»"
        window: String!
        "«до понедельника, 15:00»"
        deadlineLabel: String!
        deadline: DateTime!
        "Сколько мест осталось на рейсе"
        placesLeft: Int!
    }

    type DeliveryZoneInfo {
        code: String!
        name: String!
        window: String!
        "Стоимость доставки для этого заказа в копейках (0 — бесплатно)"
        cost: Int!
        "Порог бесплатной доставки для зоны, в копейках"
        freeThreshold: Int!
        "Сколько ещё добрать до бесплатной доставки, в копейках"
        remainingForFree: Int!
    }

    type DeliveryOptions {
        "null, если адрес не входит ни в одну зону доставки"
        zone: DeliveryZoneInfo
        runs: [DeliveryRunOption!]!
    }

    extend type Query {
        "Подсказки адресов для поля ввода на оформлении заказа"
        deliveryAddressSuggestions(query: String!, limit: Int): [DeliveryAddressSuggestion!]!

        """
        Зона, рейсы и стоимость доставки для адреса.
        Сумма заказа берётся из активного заказа.
        """
        deliveryOptions(address: String!): DeliveryOptions!
    }
`;
