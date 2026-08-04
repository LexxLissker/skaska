import { Args, Query, Resolver } from '@nestjs/graphql';
import { ActiveOrderService, Ctx, RequestContext } from '@vendure/core';

import { formatDeadline, formatRunLong, formatRunShort } from '../../../data/delivery-data';
import { DeliveryService } from '../services/delivery.service';

@Resolver()
export class DeliveryResolver {
    constructor(
        private deliveryService: DeliveryService,
        private activeOrderService: ActiveOrderService,
    ) {}

    @Query()
    async deliveryAddressSuggestions(@Args() args: { query: string; limit?: number }) {
        return this.deliveryService.suggestAddresses(args.query, args.limit ?? 6);
    }

    @Query()
    async deliveryOptions(@Ctx() ctx: RequestContext, @Args() args: { address: string }) {
        // Сумму берём из активного заказа, а не из аргумента: иначе порог
        // бесплатной доставки можно было бы «пробить» произвольным числом.
        const order = await this.activeOrderService.getActiveOrder(ctx, undefined);
        const subTotal = order?.subTotalWithTax ?? 0;

        const resolved = await this.deliveryService.resolveForAddress(ctx, args.address, subTotal);
        if (!resolved) {
            return { zone: null, runs: [] };
        }

        const { zone, runs, cost, remainingForFree } = resolved;

        return {
            zone: {
                code: zone.code,
                name: zone.name,
                window: zone.window,
                cost,
                freeThreshold: zone.freeThreshold,
                remainingForFree,
            },
            runs: runs.map(run => ({
                id: run.id,
                date: run.date,
                label: formatRunLong(run.date),
                shortLabel: formatRunShort(run.date),
                window: run.window,
                deadline: run.deadline,
                deadlineLabel: formatDeadline(run.deadline),
                placesLeft: Math.max(0, run.capacity - run.bookedCount),
            })),
        };
    }
}
