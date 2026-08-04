import { Injectable } from '@nestjs/common';
import { ID, RequestContext, TransactionalConnection } from '@vendure/core';
import { LessThan, MoreThanOrEqual } from 'typeorm';

import { computeNextRuns, DeliveryZoneDef } from '../../../data/delivery-data';
import { DeliveryRun } from '../entities/delivery-run.entity';
import { DeliveryZone } from '../entities/delivery-zone.entity';
import { TableAddressLookupStrategy } from './address-lookup.strategy';

export interface ResolvedDelivery {
    zone: DeliveryZone;
    runs: DeliveryRun[];
    /** Стоимость доставки для этого заказа с учётом порога, в копейках. */
    cost: number;
    /** Сколько ещё нужно добрать до бесплатной доставки, в копейках. 0 — уже бесплатно. */
    remainingForFree: number;
}

/** На сколько ближайших рейсов вперёд показываем даты. */
const RUNS_TO_SHOW = 4;

@Injectable()
export class DeliveryService {
    constructor(
        private connection: TransactionalConnection,
        private addressLookup: TableAddressLookupStrategy,
    ) {}

    async suggestAddresses(query: string, limit = 6) {
        return this.addressLookup.suggest(query, limit);
    }

    async findZoneByAddress(ctx: RequestContext, address: string): Promise<DeliveryZone | null> {
        const code = await this.addressLookup.resolveZoneCode(address);
        if (!code) return null;

        return this.connection
            .getRepository(ctx, DeliveryZone)
            .findOne({ where: { code, enabled: true } });
    }

    /**
     * Полный расчёт доставки для адреса и суммы заказа: зона, ближайшие рейсы,
     * стоимость с учётом порога бесплатной доставки.
     */
    async resolveForAddress(
        ctx: RequestContext,
        address: string,
        orderSubTotal: number,
    ): Promise<ResolvedDelivery | null> {
        const zone = await this.findZoneByAddress(ctx, address);
        if (!zone) return null;

        const runs = await this.ensureUpcomingRuns(ctx, zone);
        const isFree = orderSubTotal >= zone.freeThreshold;

        return {
            zone,
            runs,
            cost: isFree ? 0 : zone.cost,
            remainingForFree: Math.max(0, zone.freeThreshold - orderSubTotal),
        };
    }

    /**
     * Возвращает ближайшие рейсы зоны, создавая недостающие.
     *
     * Рейсы материализуются лениво: расписание зоны задаёт, какие дни вообще
     * возможны, а строки в базе появляются по мере того, как их начинают
     * показывать покупателям. Так у заказа всегда есть конкретный рейс,
     * на который можно сослаться и у которого можно занять место.
     */
    async ensureUpcomingRuns(ctx: RequestContext, zone: DeliveryZone, now = new Date()): Promise<DeliveryRun[]> {
        const zoneDef: DeliveryZoneDef = {
            code: zone.code,
            name: zone.name,
            weekdays: zone.weekdays.map(Number),
            window: zone.window,
            cost: zone.cost,
            freeThreshold: zone.freeThreshold,
            deadlineDaysBefore: zone.deadlineDaysBefore,
            deadlineHour: zone.deadlineHour,
        };

        const planned = computeNextRuns(zoneDef, RUNS_TO_SHOW, now);
        if (!planned.length) return [];

        const repo = this.connection.getRepository(ctx, DeliveryRun);
        const existing = await repo.find({
            where: { zoneId: String(zone.id), date: MoreThanOrEqual(planned[0].date) },
            order: { date: 'ASC' },
        });

        const byDate = new Map(existing.map(run => [run.date.getTime(), run]));
        const result: DeliveryRun[] = [];

        for (const plan of planned) {
            const found = byDate.get(plan.date.getTime());
            if (found) {
                if (!found.cancelled) result.push(found);
                continue;
            }
            const created = await repo.save(
                new DeliveryRun({
                    zone,
                    zoneId: String(zone.id),
                    date: plan.date,
                    deadline: plan.deadline,
                    window: plan.window,
                    capacity: zone.runCapacity,
                    bookedCount: 0,
                }),
            );
            result.push(created);
        }

        return result.filter(run => run.bookedCount < run.capacity);
    }

    async findRun(ctx: RequestContext, runId: ID): Promise<DeliveryRun | null> {
        return this.connection
            .getRepository(ctx, DeliveryRun)
            .findOne({ where: { id: runId as any }, relations: ['zone'] });
    }

    /**
     * Проверяет, что рейс ещё можно выбрать: не отменён, дедлайн не прошёл,
     * места остались. Вызывается перед оплатой — за время оформления заказа
     * дедлайн мог пройти, а последнее место занять кто-то другой.
     */
    async validateRun(ctx: RequestContext, runId: ID, now = new Date()): Promise<{ ok: true } | { ok: false; reason: string }> {
        const run = await this.findRun(ctx, runId);
        if (!run) return { ok: false, reason: 'Рейс не найден' };
        if (run.cancelled) return { ok: false, reason: 'Рейс отменён' };
        if (run.deadline.getTime() <= now.getTime()) {
            return { ok: false, reason: 'Приём заказов на этот рейс уже закрыт' };
        }
        if (run.bookedCount >= run.capacity) {
            return { ok: false, reason: 'На этот рейс не осталось мест' };
        }
        return { ok: true };
    }

    /** Удаляет прошедшие рейсы, на которые никто не записался. */
    async pruneStaleRuns(ctx: RequestContext, before = new Date()): Promise<number> {
        const result = await this.connection
            .getRepository(ctx, DeliveryRun)
            .delete({ date: LessThan(before), bookedCount: 0 });
        return result.affected ?? 0;
    }
}
