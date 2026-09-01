import Link from 'next/link';

import { signOutAccount } from '@/app/actions/account';
import { getAccountSession } from '@/lib/account';
import { formatPrice } from '@/lib/format';

export const metadata = { title: 'Мои заказы — Заморозка' };

const DEMO_ORDERS = [
    {
        code: '104',
        status: 'Готовим',
        statusClass: 'border-accent/40 bg-accent/10 text-accent-300',
        delivery: '2 сентября, 18:00–20:00',
        total: 237900,
        items: ['Пельмени, Говядина/свинина · 1 кг', 'Вареники с творогом · 0.5 кг'],
    },
    {
        code: '87',
        status: 'Доставлен',
        statusClass: 'border-[#6f9b7c]/40 bg-[#6f9b7c]/10 text-[#a9d5b4]',
        delivery: '24 августа, 16:00–18:00',
        total: 194000,
        items: ['Хинкали, классика · 1 кг', 'Сметанно-чесночный соус · 1 шт.'],
    },
];

export default async function AccountOrdersPage() {
    const account = await getAccountSession();

    if (!account) {
        return (
            <div className="px-4 pb-10 pt-6">
                <PageHeader />
                <section className="card mt-6 p-5 text-center">
                    <div
                        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full
                            border border-accent text-accent"
                        aria-hidden="true"
                    >
                        <AccountIcon />
                    </div>
                    <h2 className="mt-4 font-heading text-[18px] font-medium">Нужно войти</h2>
                    <p className="mt-2 text-[13px] leading-relaxed text-text/55">
                        Откройте меню внизу экрана и подтвердите номер телефона.
                    </p>
                    <Link href="/" className="btn-cta mt-5 flex items-center justify-center">
                        Вернуться в каталог
                    </Link>
                </section>
            </div>
        );
    }

    return (
        <div className="px-4 pb-10 pt-6">
            <PageHeader />
            <p className="mt-1 text-[12.5px] text-text/50">{account.phoneDisplay}</p>

            <section className="mt-5 flex flex-col gap-3" aria-label="История заказов">
                {DEMO_ORDERS.map(order => (
                    <article key={order.code} className="card p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="font-heading text-[16px] font-medium">
                                    Заказ №{order.code}
                                </h2>
                                <p className="mt-1 text-[12px] text-text/50">{order.delivery}</p>
                            </div>
                            <span
                                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px]
                                    ${order.statusClass}`}
                            >
                                {order.status}
                            </span>
                        </div>

                        <ul className="mt-4 border-y border-divider py-3">
                            {order.items.map(item => (
                                <li key={item} className="py-1 text-[12.5px] leading-relaxed text-text/65">
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <div className="mt-3 flex items-center justify-between">
                            <span className="text-[12px] text-text/50">Сумма заказа</span>
                            <strong className="font-heading text-[16px] font-medium text-accent">
                                {formatPrice(order.total)}
                            </strong>
                        </div>
                    </article>
                ))}
            </section>

            <p className="mt-4 text-center text-[11.5px] leading-relaxed text-text/40">
                В прототипе показаны демонстрационные заказы. После подключения SMS здесь будет
                история подтверждённого покупателя из Vendure.
            </p>

            <form action={signOutAccount} className="mt-5">
                <button
                    type="submit"
                    className="w-full rounded-md border border-divider py-3 text-[13px] text-text/65
                        hover:border-accent hover:text-accent"
                >
                    Выйти из кабинета
                </button>
            </form>
        </div>
    );
}

function PageHeader() {
    return (
        <header className="flex items-center gap-3">
            <Link
                href="/"
                aria-label="Назад в каталог"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-divider
                    text-[22px] text-text/70 hover:border-accent hover:text-accent"
            >
                ‹
            </Link>
            <h1 className="font-heading text-[24px] font-medium">Мои заказы</h1>
        </header>
    );
}

function AccountIcon() {
    return (
        <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
        >
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 20c.7-4 3-6 7-6s6.3 2 7 6" strokeLinecap="round" />
        </svg>
    );
}

