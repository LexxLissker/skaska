'use client';

/**
 * Контакты — компактный попап над иконкой в нижней навигации, а не панель
 * во всю ширину. Размеры и иконки взяты из прототипа.
 *
 * Ссылки берутся из переменных окружения: у небольшого производства они
 * меняются чаще, чем выкатывается код.
 */
const CONTACTS: Array<{ label: string; href: string; icon: React.ReactNode }> = [
    {
        label: 'Telegram',
        href: process.env.NEXT_PUBLIC_CONTACT_TELEGRAM || 'https://t.me/zamorozka_help',
        icon: <path d="M22 2L2 9l7 3.5M22 2l-4.5 19-7-7.5M22 2L11.5 13" strokeLinejoin="round" strokeLinecap="round" />,
    },
    {
        label: 'MAX',
        href: process.env.NEXT_PUBLIC_CONTACT_MAX || 'https://max.ru/zamorozka_help',
        icon: <path d="M7 15.5A4.5 4.5 0 017 6.6a5.5 5.5 0 0110.6-1.4A4.8 4.8 0 0121 9.8a4.3 4.3 0 01-1.2 8.4H8a4.5 4.5 0 01-1-.7z" strokeLinejoin="round" />,
    },
    {
        label: 'WhatsApp',
        href: process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || 'https://wa.me/79001234567',
        icon: <path d="M12 3a9 9 0 00-7.8 13.4L3 21l4.8-1.3A9 9 0 1012 3z" strokeLinejoin="round" />,
    },
    {
        label: 'Позвонить',
        href: `tel:${process.env.NEXT_PUBLIC_CONTACT_PHONE || '+79001234567'}`,
        icon: <path d="M6.5 3h3l1.5 5-2.5 2a13 13 0 006 6l2-2.5 5 1.5v3a2 2 0 01-2.2 2A17 17 0 014.5 5.2 2 2 0 016.5 3z" strokeLinejoin="round" />,
    },
    {
        label: 'Написать на почту',
        href: `mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@zamorozka.ru'}`,
        icon: (
            <>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M4 7l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
            </>
        ),
    },
];

export function ContactPopover({ onClose }: { onClose: () => void }) {
    return (
        <>
            {/* Клик мимо попапа закрывает его. */}
            <button
                type="button"
                aria-label="Закрыть контакты"
                onClick={onClose}
                className="fixed inset-0 z-20"
            />

            <div
                className="fixed bottom-[110px] left-1/2 z-30 w-[196px] -translate-x-1/2 rounded-md
                    border border-divider bg-surface p-1.5 shadow-[var(--shadow-md)]
                    min-[480px]:left-auto min-[480px]:right-[calc(50%-240px+56px)] min-[480px]:translate-x-0"
                role="menu"
            >
                {CONTACTS.map(contact => (
                    <a
                        key={contact.label}
                        href={contact.href}
                        target={contact.href.startsWith('http') ? '_blank' : undefined}
                        rel={contact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        role="menuitem"
                        className="flex items-center gap-2.5 rounded-sm px-2 py-[9px] text-[12.5px]
                            text-text hover:bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)]"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--color-accent-300)"
                            strokeWidth="1.6"
                            aria-hidden="true"
                            className="shrink-0"
                        >
                            {contact.icon}
                        </svg>
                        {contact.label}
                    </a>
                ))}
            </div>
        </>
    );
}
