'use client';

import Link from 'next/link';
import { useState } from 'react';

import { AccountSheet } from './account-sheet';
import { ContactPopover } from './contact-popover';
import { SearchPanel } from './search-panel';

/**
 * Постоянная нижняя панель: бренд, поиск, контакты, корзина и меню.
 *
 * Поиск и контакты взаимоисключающие — открытие одного закрывает другое.
 * Меню аккаунта живёт отдельно и может быть открыто поверх чего угодно.
 */
export function BottomNav({ cartQuantity }: { cartQuantity: number }) {
    const [panel, setPanel] = useState<'search' | 'contact' | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    const toggle = (next: 'search' | 'contact') => setPanel(cur => (cur === next ? null : next));

    return (
        <>
            {panel === 'search' && <SearchPanel onClose={() => setPanel(null)} />}
            {panel === 'contact' && <ContactPopover onClose={() => setPanel(null)} />}
            {menuOpen && <AccountSheet onClose={() => setMenuOpen(false)} />}

            <nav
                className="fixed bottom-0 z-40 flex h-16 w-full max-w-[480px] items-center
                    justify-between border-t border-divider px-4
                    [background:rgba(17,24,39,.85)] [backdrop-filter:blur(12px)]"
                aria-label="Основная навигация"
            >
                <Link
                    href="/"
                    className="font-heading text-[15px] font-medium tracking-tight text-accent-300"
                >
                    Заморозка
                </Link>

                <div className="flex items-center gap-1">
                    <NavButton
                        label="Поиск"
                        active={panel === 'search'}
                        onClick={() => toggle('search')}
                    >
                        <path d="M11 4a7 7 0 105.2 11.7l4 4" />
                    </NavButton>

                    <NavButton
                        label="Связаться"
                        active={panel === 'contact'}
                        onClick={() => toggle('contact')}
                    >
                        <path d="M4 5h16v12H7l-3 3z" />
                    </NavButton>

                    <Link
                        href="/cart"
                        aria-label={`Корзина, ${cartQuantity} товаров`}
                        className="relative flex h-10 w-10 items-center justify-center rounded-full
                            text-text/70 transition-colors hover:text-accent"
                        data-cart-icon
                    >
                        <svg
                            width="21"
                            height="21"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M6 6h15l-1.5 9h-12z" />
                            <circle cx="9" cy="20" r="1.4" />
                            <circle cx="18" cy="20" r="1.4" />
                            <path d="M6 6L5 2H2" />
                        </svg>
                        {cartQuantity > 0 && (
                            <span
                                className="absolute right-1 top-1 min-w-[17px] rounded-full
                                    bg-accent px-1 text-center font-heading text-[10px]
                                    font-semibold leading-[17px] text-[#1a1206]"
                            >
                                {cartQuantity}
                            </span>
                        )}
                    </Link>

                    <NavButton label="Меню" active={menuOpen} onClick={() => setMenuOpen(true)}>
                        <path d="M4 7h16M4 12h16M4 17h16" />
                    </NavButton>
                </div>
            </nav>
        </>
    );
}

function NavButton({
    label,
    active,
    onClick,
    children,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            aria-pressed={active}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors
                ${active ? 'text-accent' : 'text-text/70 hover:text-accent'}`}
        >
            <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                {children}
            </svg>
        </button>
    );
}
