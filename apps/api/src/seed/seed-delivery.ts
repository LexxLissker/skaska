import { INestApplicationContext } from '@nestjs/common';
import { RequestContext, TransactionalConnection } from '@vendure/core';

import { toMinorUnits } from '../data/catalog-data';
import { DELIVERY_ZONES } from '../data/delivery-data';
import { DeliveryZone } from '../plugins/scheduled-delivery/entities/delivery-zone.entity';

/** Заводит зоны доставки из справочника. Повторный запуск обновляет существующие. */
export async function seedDeliveryZones(app: INestApplicationContext, ctx: RequestContext): Promise<void> {
    const connection = app.get(TransactionalConnection);
    const repo = connection.getRepository(ctx, DeliveryZone);

    for (const def of DELIVERY_ZONES) {
        const existing = await repo.findOne({ where: { code: def.code } });

        const values = {
            code: def.code,
            name: def.name,
            weekdays: def.weekdays,
            window: def.window,
            cost: toMinorUnits(def.cost),
            freeThreshold: toMinorUnits(def.freeThreshold),
            deadlineDaysBefore: def.deadlineDaysBefore,
            deadlineHour: def.deadlineHour,
            enabled: true,
        };

        if (existing) {
            await repo.save({ ...existing, ...values });
        } else {
            await repo.save(new DeliveryZone(values));
        }
    }

    console.log(`  ✓ зоны доставки: ${DELIVERY_ZONES.map(z => z.name).join(', ')}`);
}
