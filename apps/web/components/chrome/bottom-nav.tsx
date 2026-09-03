'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AccountSheet } from './account-sheet';
import { ContactPopover } from './contact-popover';
import { SearchPanel } from './search-panel';

type DesktopSection = 'catalog' | 'bundles' | 'delivery' | 'how-we-cook';

const desktopSections: DesktopSection[] = ['catalog', 'bundles', 'delivery', 'how-we-cook'];

/**
 * Постоянная нижняя панель из макета: золотой бренд-кружок, поиск, корзина,
 * контакты и меню. Поиск и контакты взаимоисключающие.
 */
export function BottomNav({
    cartQuantity,
    accountPhone,
}: {
    cartQuantity: number;
    accountPhone: string | null;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [panel, setPanel] = useState<'search' | 'contact' | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<DesktopSection | null>(
        pathname === '/' || pathname.startsWith('/palette/') ? 'catalog' : null,
    );
    const cartOpen = pathname === '/cart';
    const catalogPagePath = pathname.startsWith('/palette/') ? pathname : '/';

    const toggle = (next: 'search' | 'contact') => setPanel(cur => (cur === next ? null : next));

    useEffect(() => {
        if (pathname !== '/' && !pathname.startsWith('/palette/')) {
            setActiveSection(null);
            return;
        }

        const updateActiveSection = () => {
            const marker = window.scrollY + 160;
            let current: DesktopSection = 'catalog';

            for (const section of desktopSections) {
                const element = document.getElementById(section);
                if (element && element.offsetTop <= marker) current = section;
            }

            setActiveSection(current);
        };

        updateActiveSection();
        window.addEventListener('scroll', updateActiveSection, { passive: true });
        return () => window.removeEventListener('scroll', updateActiveSection);
    }, [pathname]);

    const desktopLinkClass = (section: DesktopSection) =>
        `border-b-2 py-2 text-[14px] no-underline transition-colors ${
            activeSection === section
                ? 'border-accent text-accent'
                : 'border-transparent text-text/65 hover:text-accent'
        }`;

    return (
        <>
            {panel === 'search' && <SearchPanel onClose={() => setPanel(null)} />}
            {panel === 'contact' && <ContactPopover onClose={() => setPanel(null)} />}
            {menuOpen && (
                <AccountSheet
                    accountPhone={accountPhone}
                    onClose={() => setMenuOpen(false)}
                />
            )}

            <header
                className="fixed inset-x-0 top-0 z-40 hidden h-[72px] border-b border-divider
                    bg-[color-mix(in_srgb,var(--color-bg)_86%,transparent)] backdrop-blur-xl lg:block"
            >
                <div className="mx-auto flex h-full max-w-[1280px] items-center gap-8 px-8">
                    <Link href="/" className="flex shrink-0 items-center gap-3 text-text no-underline">
                        <span className="gold-circle h-10 w-10 text-[17px]">С</span>
                        <span className="font-heading text-[20px] font-semibold tracking-[0.01em]">
                            Скаска
                        </span>
                    </Link>

                    <div className="h-7 w-px bg-divider" aria-hidden="true" />

                    <nav className="flex items-center gap-7" aria-label="Разделы магазина">
                        <Link
                            href={`${catalogPagePath}#catalog`}
                            className={desktopLinkClass('catalog')}
                            onClick={() => setActiveSection('catalog')}
                        >
                            Каталог
                        </Link>
                        <Link
                            href={`${catalogPagePath}#bundles`}
                            className={desktopLinkClass('bundles')}
                            onClick={() => setActiveSection('bundles')}
                        >
                            Наборы
                        </Link>
                        <Link
                            href={`${catalogPagePath}#how-we-cook`}
                            className={desktopLinkClass('how-we-cook')}
                            onClick={() => setActiveSection('how-we-cook')}
                        >
                            Как готовим
                        </Link>
                        <Link
                            href={`${catalogPagePath}#delivery`}
                            className={desktopLinkClass('delivery')}
                            onClick={() => setActiveSection('delivery')}
                        >
                            Доставка
                        </Link>
                    </nav>

                    <div className="ml-auto flex items-center gap-2">
                        <DesktopAction
                            label="Поиск"
                            active={panel === 'search'}
                            onClick={() => toggle('search')}
                        >
                            <circle cx="11" cy="11" r="7" />
                            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                        </DesktopAction>

                        <DesktopAction
                            label="Связаться"
                            active={panel === 'contact'}
                            onClick={() => toggle('contact')}
                        >
                            <path d="M4 5h16v12H7l-3 3z" strokeLinejoin="round" />
                        </DesktopAction>

                        <button
                            type="button"
                            onClick={() => setMenuOpen(true)}
                            className="flex h-10 items-center gap-2 rounded-full border border-divider px-3.5
                                text-[13px] text-text/75 hover:border-accent hover:text-accent"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                                <circle cx="12" cy="8" r="3.5" />
                                <path d="M5 20c.7-4 3-6 7-6s6.3 2 7 6" strokeLinecap="round" />
                            </svg>
                            {accountPhone ?? 'Кабинет'}
                        </button>

                        <button
                            type="button"
                            onClick={() => (cartOpen ? router.back() : router.push('/cart'))}
                            aria-label={cartOpen ? 'Закрыть корзину' : `Открыть корзину, товаров: ${cartQuantity}`}
                            className="relative flex h-10 items-center gap-2 rounded-full border border-accent
                                bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] px-4
                                text-[13px] text-accent hover:bg-[color-mix(in_srgb,var(--color-accent)_17%,transparent)]"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
                                <path d="M6 8h12l-1.2 11a2 2 0 01-2 1.8H9.2a2 2 0 01-2-1.8L6 8z" />
                                <path d="M9 8V6a3 3 0 016 0v2" />
                            </svg>
                            Корзина
                            {cartQuantity > 0 && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-bg">
                                    {cartQuantity}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <nav
                className="fixed bottom-0 z-40 flex h-16 w-full max-w-[412px] items-center
                    justify-around border-t border-divider px-2
                    [background:rgba(17,24,39,.85)] [backdrop-filter:blur(12px)] lg:hidden"
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

                <button
                    type="button"
                    onClick={() => (cartOpen ? router.back() : router.push('/cart'))}
                    aria-label={
                        cartOpen
                            ? 'Закрыть корзину'
                            : `Открыть корзину, товаров: ${cartQuantity}`
                    }
                    aria-pressed={cartOpen}
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

function DesktopAction({
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
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors
                ${active ? 'border-accent bg-accent/10 text-accent' : 'border-divider text-text/65 hover:border-accent hover:text-accent'}`}
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                {children}
            </svg>
        </button>
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
