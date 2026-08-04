'use client';

/**
 * Контакты магазина. Ссылки берутся из переменных окружения — у небольшого
 * производства они меняются чаще, чем выкатывается код.
 */
const CONTACTS = [
    { label: 'Telegram', href: process.env.NEXT_PUBLIC_CONTACT_TELEGRAM || 'https://t.me/' },
    { label: 'MAX', href: process.env.NEXT_PUBLIC_CONTACT_MAX || '#' },
    { label: 'WhatsApp', href: process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || '#' },
    { label: 'Телефон', href: `tel:${process.env.NEXT_PUBLIC_CONTACT_PHONE || '+70000000000'}` },
    { label: 'Почта', href: `mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@example.com'}` },
];

export function ContactPopover({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed bottom-16 z-40 w-full max-w-[480px] border-t border-divider bg-surface px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[15px] font-medium">Связаться с нами</h2>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Закрыть"
                    className="px-2 text-text/55 hover:text-accent"
                >
                    ×
                </button>
            </div>
            <ul className="flex flex-col">
                {CONTACTS.map(contact => (
                    <li key={contact.label}>
                        <a
                            href={contact.href}
                            target={contact.href.startsWith('http') ? '_blank' : undefined}
                            rel={contact.href.startsWith('http') ? 'noreferrer' : undefined}
                            className="flex items-center justify-between border-b border-divider
                                py-2.5 text-[14px] text-text last:border-0 hover:text-accent"
                        >
                            {contact.label}
                            <span aria-hidden="true" className="text-text/45">
                                ›
                            </span>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
