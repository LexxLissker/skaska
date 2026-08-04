import { Injectable } from '@nestjs/common';

import { ADDRESS_POOL, ADDRESS_ZONE_MAP } from '../../../data/delivery-data';

export interface AddressSuggestion {
    /** Строка адреса в том виде, в котором её показываем и сохраняем. */
    value: string;
}

/**
 * Определение зоны по адресу.
 *
 * Реализация на MVP — таблица соответствий из прототипа. Этого достаточно,
 * пока зон четыре и адреса вводятся из подсказок. Когда понадобится реальное
 * покрытие города, сюда подставляется реализация поверх DaData или
 * Яндекс.Геокодера (нормализация адреса → координаты → зона), а при росте числа
 * зон — геометрия полигонов через PostGIS. Остальной код плагина не меняется.
 */
export interface AddressLookupStrategy {
    /** Подсказки адресов по введённой строке. */
    suggest(query: string, limit: number): Promise<AddressSuggestion[]>;

    /** Код зоны для адреса, либо null если адрес вне зоны доставки. */
    resolveZoneCode(address: string): Promise<string | null>;
}

@Injectable()
export class TableAddressLookupStrategy implements AddressLookupStrategy {
    async suggest(query: string, limit: number): Promise<AddressSuggestion[]> {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return [];

        return ADDRESS_POOL.filter(a => a.toLowerCase().includes(normalized))
            .slice(0, limit)
            .map(value => ({ value }));
    }

    async resolveZoneCode(address: string): Promise<string | null> {
        return ADDRESS_ZONE_MAP[address.trim()] ?? null;
    }
}
