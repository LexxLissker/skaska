import { DeepPartial, VendureEntity } from '@vendure/core';
import { Column, Entity, Index, ManyToOne, Unique } from 'typeorm';

import { DeliveryZone } from './delivery-zone.entity';

/**
 * Конкретный рейс: «зона Центр, вторник 12 августа, 18:00–21:00».
 *
 * Рейсы материализуются в базе (а не вычисляются каждый раз), потому что
 * заказ должен ссылаться на конкретный рейс, а у рейса есть вместимость —
 * иначе на последнее место можно продать несколько заказов.
 */
@Entity()
@Unique(['zone', 'date'])
export class DeliveryRun extends VendureEntity {
    constructor(input?: DeepPartial<DeliveryRun>) {
        super(input);
    }

    @Index()
    @ManyToOne(() => DeliveryZone, zone => zone.runs, { onDelete: 'CASCADE' })
    zone: DeliveryZone;

    @Column()
    zoneId: string;

    /** Дата рейса, начало дня. */
    @Index()
    @Column({ type: 'timestamp' })
    date: Date;

    /** Момент, до которого принимаем заказы на этот рейс. */
    @Column({ type: 'timestamp' })
    deadline: Date;

    @Column()
    window: string;

    @Column()
    capacity: number;

    /** Сколько мест уже занято подтверждёнными заказами. */
    @Column({ default: 0 })
    bookedCount: number;

    @Column({ default: false })
    cancelled: boolean;
}
