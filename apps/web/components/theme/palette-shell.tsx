'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const palettePaths = new Set(['ink', 'graphite', 'espresso']);

export function PaletteShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const candidate = pathname.split('/')[2] ?? '';
    const palette = palettePaths.has(candidate) ? candidate : 'default';

    return (
        <div
            data-palette={palette}
            className="relative mx-auto flex min-h-dvh w-full max-w-[412px] flex-col bg-bg text-text lg:max-w-none"
        >
            {children}
        </div>
    );
}
