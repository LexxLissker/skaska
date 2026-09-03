import Link from 'next/link';

export type PaletteKey = 'ink' | 'graphite' | 'espresso';

const palettes: Array<{ key: PaletteKey | 'default'; label: string; href: string }> = [
    { key: 'default', label: 'Текущая', href: '/' },
    { key: 'ink', label: 'Чернильная', href: '/palette/ink' },
    { key: 'graphite', label: 'Графит', href: '/palette/graphite' },
    { key: 'espresso', label: 'Эспрессо', href: '/palette/espresso' },
];

export function PaletteSwitcher({ active }: { active: PaletteKey }) {
    return (
        <aside
            className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full
                border border-divider bg-surface/95 p-1.5 shadow-[0_14px_40px_rgba(0,0,0,.48)]
                backdrop-blur-xl lg:bottom-5"
            aria-label="Сравнение цветовых палитр"
        >
            {palettes.map(palette => (
                <Link
                    key={palette.key}
                    href={palette.href}
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] no-underline transition-colors lg:text-[12px]
                        ${palette.key === active ? 'bg-accent text-bg' : 'text-text/60 hover:text-accent'}`}
                >
                    {palette.label}
                </Link>
            ))}
        </aside>
    );
}
