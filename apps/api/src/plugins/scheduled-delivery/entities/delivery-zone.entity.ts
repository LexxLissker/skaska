import { DeepPartial, VendureEntity } from '@vendure/core';
import { Column, Entity, OneToMany } from 'typeorm';

import { DeliveryRun } from './delivery-run.entity';

/**
 * Зона доставки: набор адресов, которые обслуживаются по общему расписанию,
 * с собственной стоимостью и порогом бесплатной доставки.
 *
 * Расписание хранится прямо в зоне (дни недели + интервал + дедлайн) — этого
 * достаточно, пока у зоны один регулярный рейс в день. Если понадобятся
 * несколько разных рейсов в один день, расписание выносится в отдельную
 * сущность DeliveryScheduleTemplate со связью «многие к одному» на зону.
 */
@Entity()
export class DeliveryZone extends VendureEntity {
    constructor(input?: DeepPartial<DeliveryZone>) {
        super(input);
    }

    @Column({ unique: true })
    code: string;

    @Column()
    name: string;

    /** Дни недели рейсов: 0 — воскресенье … 6 — суббота. */
    @Column('simple-array')
    weekdays: number[];

    /** Интервал доставки в человекочитаемом виде, например «18:00–21:00». */
    @Column()
    window: string;

    /** Стоимость доставки в минорных единицах (копейках). */
    @Column()
    cost: number;

    /** Сумма заказа, начиная с которой доставка бесплатна, в копейках. */
    @Column()
    freeThreshold: number;

    /** За сколько дней до рейса закрывается приём заказов. */
    @Column({ default: 1 })
    deadlineDaysBefore: number;

    /** Час закрытия приёма заказов в день дедлайна. */
    @Column({ default: 15 })
    deadlineHour: number;

    /** Сколько заказов помещается в один рейс. */
    @Column({ default: 20 })
    runCapacity: number;

    @Column({ default: true })
    enabled: boolean;

    @OneToMany(() => DeliveryRun, run => run.zone)
    runs: DeliveryRun[];
}
