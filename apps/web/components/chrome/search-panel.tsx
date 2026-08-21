'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { searchProducts, type SearchHit } from '@/app/actions/search';
import { formatPrice } from '@/lib/format';

/**
 * Поиск по каталогу. В макете это поле, разворачивающееся в нижней навигации,
 * с круглой акцентной кнопкой закрытия справа.
 */
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

        // Ждём паузу в наборе, чтобы не слать запрос на каждую букву.
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
        <div className="fixed bottom-16 z-40 w-full max-w-[480px] border-t border-divider bg-bg px-4 py-2.5">
            <div className="relative flex h-10 items-center rounded-full border border-divider bg-surface-2">
                <input
                    ref={inputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Поиск блюд"
                    aria-label="Поиск блюд"
                    className="h-full min-w-0 flex-1 border-none bg-transparent pl-3.5 pr-10
                        text-[13.5px] text-text outline-none placeholder:text-text/45"
                />
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Закрыть поиск"
                    className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center
                        justify-center rounded-full text-accent"
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        aria-hidden="true"
                    >
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                    </svg>
                </button>
            </div>

            {query.trim().length >= 2 && (
                <div className="mt-2.5 max-h-[45vh] overflow-y-auto">
                    {pending && hits.length === 0 && (
                        <p className="py-3 text-center text-[13px] text-text/45">Ищем…</p>
                    )}
                    {!pending && hits.length === 0 && (
                        <p className="py-3 text-center text-[13px] text-text/45">Ничего не нашлось</p>
                    )}
                    <ul className="flex flex-col">
                        {hits.map(hit => (
                            <li key={hit.slug}>
                                <Link
                                    href={`/product/${hit.slug}`}
                                    onClick={onClose}
                                    className="flex items-center justify-between gap-3 border-b
                                        border-divider px-0.5 py-2.5 text-[13.5px] text-text
                                        last:border-0 hover:text-accent"
                                >
                                    <span className="min-w-0 truncate">{hit.name}</span>
                                    <span className="shrink-0 text-accent-300">
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
