import Link from 'next/link';

const catalogLinks = [
    { label: 'Пельмени', href: '/#catalog' },
    { label: 'Вареники', href: '/#catalog' },
    { label: 'Манты и хинкали', href: '/#catalog' },
    { label: 'Наборы для дома', href: '/#bundles' },
];

const customerLinks = [
    { label: 'Доставка и оплата', href: '/#delivery' },
    { label: 'Мои заказы', href: '/account/orders' },
    { label: 'Документы', href: '/docs' },
    { label: 'Как мы готовим', href: '/#how-we-cook' },
];

export function DesktopFooter() {
    return (
        <footer className="hidden bg-[linear-gradient(180deg,var(--color-bg)_0%,#0d1422_100%)] lg:block">
            <div className="mx-auto grid max-w-[1280px] grid-cols-[1.4fr_1fr_1fr] gap-16 px-8 pb-10 pt-14">
                <div className="max-w-[410px]">
                    <Link href="/" className="inline-flex items-center gap-3 text-text no-underline">
                        <span className="gold-circle h-11 w-11 text-[18px]">С</span>
                        <span className="font-heading text-[23px] font-semibold">Скаска</span>
                    </Link>
                    <p className="mt-5 text-[14px] leading-6 text-text/58">
                        Домашние полуфабрикаты ручной лепки. Готовим небольшими партиями
                        и привозим по Санкт-Петербургу по расписанию.
                    </p>
                </div>

                <FooterColumn title="Каталог" links={catalogLinks} />
                <FooterColumn title="Покупателям" links={customerLinks} />
            </div>

            <div className="mx-auto flex max-w-[1280px] items-center justify-between px-8 pb-7 text-[12px] text-text/40">
                <span>© 2026 Скаска</span>
                <span>Ручная лепка · Доставка по расписанию</span>
            </div>
        </footer>
    );
}

function FooterColumn({
    title,
    links,
}: {
    title: string;
    links: Array<{ label: string; href: string }>;
}) {
    return (
        <div>
            <h2 className="mb-4 text-[15px] font-medium text-text">{title}</h2>
            <nav className="flex flex-col items-start gap-3" aria-label={title}>
                {links.map(link => (
                    <Link
                        key={link.label}
                        href={link.href}
                        className="text-[13px] text-text/55 no-underline transition-colors hover:text-accent"
                    >
                        {link.label}
                    </Link>
                ))}
            </nav>
        </div>
    );
}
