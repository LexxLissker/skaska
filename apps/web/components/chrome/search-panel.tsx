'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { searchProducts, type SearchHit } from '@/app/actions/search';
import { formatPrice } from '@/lib/format';

/** Первый вариант поиска по каталогу: отдельная строка над нижней панелью. */
export function SearchPanel({ onClose }: { onClose: () => void }) {
    const [query, setQuery] = useState('');
    const [hits, setHits] = useState<SearchHit[]>([]);
    const [pending, setPending] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        const term = query.trim();
        if (term.length < 2) {
            setHits([]);
            return;
        }

        setPending(true);
        const timer = setTimeout(async () => {
            try {
                setHits(await searchProducts(term));
            } finally {
                setPending(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="fixed bottom-16 z-40 w-full max-w-[412px] border-t border-divider bg-surface px-4 py-3">
            <div className="flex items-center gap-2">
                <input
                    ref={inputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Найти пельмени, вареники…"
                    className="min-h-9 w-full rounded-md border border-divider bg-surface-2 px-3
                        text-sm text-text placeholder:text-text/45 focus-visible:border-accent"
                    aria-label="Поиск по каталогу"
                />
                <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 px-2 text-sm text-text/55 hover:text-accent"
                >
                    Отмена
                </button>
            </div>

            {query.trim().length >= 2 && (
                <div className="mt-3 max-h-[45vh] overflow-y-auto">
                    {pending && hits.length === 0 && (
                        <p className="py-3 text-center text-[13px] text-text/45">Ищем…</p>
                    )}
                    {!pending && hits.length === 0 && (
                        <p className="py-3 text-center text-[13px] text-text/45">
                            Ничего не нашлось
                        </p>
                    )}
                    <ul className="flex flex-col gap-1">
                        {hits.map(hit => (
                            <li key={hit.slug}>
                                <Link
                                    href={`/product/${hit.slug}`}
                                    onClick={onClose}
                                    className="flex items-center justify-between gap-3 rounded-md
                                        px-2 py-2 hover:bg-surface-2"
                                >
                                    <span className="text-[14px] text-text">{hit.name}</span>
                                    <span className="shrink-0 font-heading text-[13px] text-accent-300">
                                        {formatPrice(hit.price)}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
