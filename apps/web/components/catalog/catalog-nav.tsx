'use client';

import type { Category } from '@/lib/api/catalog';

/**
 * Два ряда навигации каталога: чипсы категорий и вкладки подкатегорий.
 *
 * Рендерится дважды — в потоке страницы и в липкой панели внизу, поэтому
 * вынесено отдельно. Размеры взяты из `chipStyle` прототипа.
 */
export function CatalogNav({
    categories,
    activeCategory,
    activeSub,
    onCategory,
    onSub,
}: {
    categories: Category[];
    activeCategory: string;
    activeSub: string | null;
    onCategory: (slug: string) => void;
    onSub: (slug: string) => void;
}) {
    const category = categories.find(c => c.slug === activeCategory) ?? categories[0];

    return (
        <>
            <div
                className="noscroll flex gap-2 overflow-x-auto px-4 pb-2 lg:justify-center lg:gap-3"
                role="tablist"
                aria-label="Категории"
            >
                {categories.map(item => {
                    const active = item.slug === activeCategory;
                    return (
                        <button
                            key={item.slug}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => onCategory(item.slug)}
                            className={`shrink-0 whitespace-nowrap rounded-full border px-[14px] py-[7px]
                                font-heading text-[14px] font-medium lg:px-[18px] lg:py-[8px] lg:text-[15px]
                                ${
                                    active
                                        ? 'border-accent bg-surface-2 text-accent shadow-[0_0_12px_rgba(229,184,75,0.18)]'
                                        : 'border-divider bg-transparent text-[#a5b8de]'
                                }`}
                        >
                            {item.name}
                        </button>
                    );
                })}
            </div>

            {category.children.length > 0 && (
                <div
                    className="noscroll flex gap-4 overflow-x-auto px-4 pb-3 lg:justify-center lg:gap-7 lg:pt-1"
                    role="tablist"
                    aria-label="Подкатегории"
                >
                    {category.children.map(sub => {
                        const active = sub.slug === activeSub;
                        return (
                            <button
                                key={sub.slug}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => onSub(sub.slug)}
                                className={`shrink-0 whitespace-nowrap border-b-2 py-0.5 font-heading
                                    text-[13px] font-medium lg:text-[14px]
                                    ${
                                        active
                                            ? 'border-accent text-accent'
                                            : 'border-transparent text-text/55'
                                    }`}
                            >
                                {sub.name}
                            </button>
                        );
                    })}
                </div>
            )}
        </>
    );
}
