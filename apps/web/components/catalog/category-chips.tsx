'use client';

import type { Category } from '@/lib/api/catalog';

/**
 * Лента категорий. Активный чип получает акцентную рамку и мягкое свечение —
 * то же выделение, что у пилюль опций на карточке товара.
 */
export function CategoryChips({
    categories,
    activeSlug,
    onSelect,
    compact = false,
}: {
    categories: Category[];
    activeSlug: string;
    onSelect: (slug: string) => void;
    compact?: boolean;
}) {
    return (
        <div
            className={`noscroll flex gap-2 overflow-x-auto px-4 ${compact ? 'py-2.5' : 'py-3.5'}`}
            role="tablist"
            aria-label="Категории"
        >
            {categories.map(category => {
                const active = category.slug === activeSlug;
                return (
                    <button
                        key={category.slug}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onSelect(category.slug)}
                        className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5
                            font-heading text-[13.5px] transition-colors
                            ${
                                active
                                    ? 'chip-active bg-surface-2 text-accent'
                                    : 'border-divider text-text/70 hover:text-text'
                            }`}
                    >
                        {category.name}
                    </button>
                );
            })}
        </div>
    );
}
