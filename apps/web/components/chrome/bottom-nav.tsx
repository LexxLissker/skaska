'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AccountSheet } from './account-sheet';
import { ContactPopover } from './contact-popover';
import { SearchPanel } from './search-panel';

/**
 * Постоянная нижняя панель из макета: золотой бренд-кружок, поиск, корзина,
 * контакты и меню. Порядок и размеры иконок — как в прототипе.
 *
 * Поиск и контакты взаимоисключающие: открытие одного закрывает другое.
 */
export function BottomNav({ cartQuantity }: { cartQuantity: number }) {
    const router = useRouter();
    const [panel, setPanel] = useState<'search' | 'contact' | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    const toggle = (next: 'search' | 'contact') => setPanel(cur => (cur === next ? null : next));

    return (
        <>
            {panel === 'search' && <SearchPanel onClose={() => setPanel(null)} />}
            {panel === 'contact' && <ContactPopover onClose={() => setPanel(null)} />}
            {menuOpen && <AccountSheet onClose={() => setMenuOpen(false)} />}

            <nav
                className="fixed bottom-0 z-40 flex h-16 w-full max-w-[412px] items-center
                    justify-around border-t border-divider px-2
                    [background:rgba(17,24,39,.85)] [backdrop-filter:blur(12px)]"
                aria-label="Основная навигация"
            >
                <Link
                    href="/"
                    aria-label="На главную"
                    className="gold-circle h-[34px] w-[34px] text-[13px]"
                >
                    З
                </Link>

                <IconButton label="Поиск" active={panel === 'search'} onClick={() => toggle('search')}>
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                </IconButton>

                {/* Корзина — единственная акцентная иконка в панели. */}
                <button
                    type="button"
                    onClick={() => router.push('/cart')}
                    aria-label={`Корзина, товаров: ${cartQuantity}`}
                    data-cart-icon
                    className="relative flex p-1"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--color-accent)"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M6 8h12l-1.2 11a2 2 0 01-2 1.8H9.2a2 2 0 01-2-1.8L6 8z" />
                        <path d="M9 8V6a3 3 0 016 0v2" />
                    </svg>
                    {cartQuantity > 0 && (
                        <span
                            className="absolute -right-2 -top-1.5 flex h-[15px] min-w-[15px] items-center
                                justify-center rounded-full bg-accent px-[3px] text-[10px] font-bold
                                leading-none text-bg"
                        >
                            {cartQuantity}
                        </span>
                    )}
                </button>

                <IconButton
                    label="Связаться"
                    active={panel === 'contact'}
                    onClick={() => toggle('contact')}
                >
                    <path d="M4 5h16v12H7l-3 3z" strokeLinejoin="round" />
                </IconButton>

                <IconButton label="Меню" active={menuOpen} onClick={() => setMenuOpen(true)}>
                    <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                </IconButton>
            </nav>
        </>
    );
}

function IconButton({
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
            className="flex p-1"
        >
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={active ? 'var(--color-accent)' : 'var(--color-neutral-400)'}
                strokeWidth="1.6"
                aria-hidden="true"
            >
                {children}
            </svg>
        </button>
    );
}
