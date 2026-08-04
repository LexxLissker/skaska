'use client';

import { useEffect, useRef, useState, useTransition } from 'react';

import { loadProducts } from '@/app/actions/catalog';
import type { Category, ProductCard as ProductCardType } from '@/lib/api/catalog';
import { FAQS, OFFERS, REVIEWS, STEPS } from '@/lib/content';
import { CategoryChips } from './category-chips';
import { FaqAccordion } from './faq-accordion';
import { ImagePlaceholder } from './image-placeholder';
import { ProductCard } from './product-card';
import { ReviewRail } from './review-rail';

/** В сетке сначала 6 карточек, «Показать ещё» открывает по две. */
const INITIAL_VISIBLE = 6;
const VISIBLE_STEP = 2;

/** На сколько прокрутить каталог, прежде чем появится липкая панель категорий. */
const DOCK_THRESHOLD = 790;

interface Props {
    categories: Category[];
    initialCategorySlug: string;
    initialProducts: ProductCardType[];
}

export function CatalogView({ categories, initialCategorySlug, initialProducts }: Props) {
    const [activeCategory, setActiveCategory] = useState(initialCategorySlug);
    const [activeSub, setActiveSub] = useState<string | null>(null);
    const [products, setProducts] = useState(initialProducts);
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
    const [docked, setDocked] = useState(false);
    const [pending, startTransition] = useTransition();

    const catalogEndRef = useRef<HTMLDivElement>(null);

    const category = categories.find(c => c.slug === activeCategory) ?? categories[0];
    const subcategory = category.children.find(s => s.slug === activeSub) ?? null;

    // Липкая панель появляется, когда каталог ушёл вверх, и исчезает,
    // когда он полностью прокручен — ниже она уже не нужна.
    useEffect(() => {
        const onScroll = () => {
            const end = catalogEndRef.current?.getBoundingClientRect().bottom ?? 0;
            setDocked(window.scrollY > DOCK_THRESHOLD && end > 0);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    function switchTo(categorySlug: string, subSlug: string | null) {
        setActiveCategory(categorySlug);
        setActiveSub(subSlug);
        // Переключение всегда возвращает сетку к исходным шести карточкам.
        setVisibleCount(INITIAL_VISIBLE);

        startTransition(async () => {
            setProducts(await loadProducts(subSlug ?? categorySlug));
        });
    }

    const visible = products.slice(0, visibleCount);
    const reviews = REVIEWS[category.slug] ?? REVIEWS.pelmeni;

    return (
        <>
            {/* ── Герой категории ───────────────────────────────────────────── */}
            <header className="relative">
                <ImagePlaceholder
                    src={category.assetUrl}
                    alt={category.name}
                    className="aspect-[4/3] w-full"
                />
                {/* Затемнение к низу, чтобы текст читался поверх фотографии. */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/85 to-transparent px-4 pb-5 pt-16">
                    <h1 className="font-heading text-[26px] font-medium">{category.name}</h1>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-text/65">
                        {category.description}
                    </p>
                </div>
            </header>

            {/* ── Липкая панель категорий ───────────────────────────────────── */}
            <div
                className={`fixed top-0 z-30 w-full max-w-[480px] border-b border-divider
                    [background:rgba(9,13,22,.92)] [backdrop-filter:blur(12px)]
                    transition-[opacity,transform] duration-[320ms]
                    ${docked ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0'}`}
                aria-hidden={!docked}
            >
                <CategoryChips
                    categories={categories}
                    activeSlug={activeCategory}
                    onSelect={slug => switchTo(slug, null)}
                    compact
                />
            </div>

            {/* ── Категории и подкатегории ──────────────────────────────────── */}
            <CategoryChips
                categories={categories}
                activeSlug={activeCategory}
                onSelect={slug => switchTo(slug, null)}
            />

            {category.children.length > 0 && (
                <nav className="noscroll flex gap-4 overflow-x-auto border-b border-divider px-4">
                    <SubTab
                        label="Все"
                        active={activeSub === null}
                        onClick={() => switchTo(activeCategory, null)}
                    />
                    {category.children.map(sub => (
                        <SubTab
                            key={sub.slug}
                            label={sub.name}
                            active={activeSub === sub.slug}
                            onClick={() => switchTo(activeCategory, sub.slug)}
                        />
                    ))}
                </nav>
            )}

            {subcategory && (
                <section className="relative">
                    <ImagePlaceholder
                        src={null}
                        alt={subcategory.name}
                        className="h-[180px] w-full"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg to-transparent px-4 pb-4 pt-10">
                        <h2 className="font-heading text-[19px] font-medium">{subcategory.name}</h2>
                        <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-text/60">
                            {subcategory.description}
                        </p>
                    </div>
                </section>
            )}

            {/* ── Сетка товаров ─────────────────────────────────────────────── */}
            <section className="px-4 pt-5" aria-busy={pending}>
                {products.length === 0 ? (
                    <p className="py-10 text-center text-[13px] text-text/45">
                        В этой подкатегории пока нет товаров
                    </p>
                ) : (
                    <>
                        <div className={`grid grid-cols-2 gap-3 ${pending ? 'opacity-60' : ''}`}>
                            {visible.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {visibleCount < products.length && (
                            <button
                                type="button"
                                onClick={() => setVisibleCount(c => c + VISIBLE_STEP)}
                                className="mt-4 w-full rounded-md border border-divider py-2.5
                                    font-heading text-[14px] text-text/80 transition-colors
                                    hover:border-accent hover:text-accent"
                            >
                                Показать ещё
                            </button>
                        )}
                    </>
                )}
            </section>

            <div ref={catalogEndRef} />

            {/* ── Отзывы ────────────────────────────────────────────────────── */}
            <ReviewRail reviews={reviews} />

            {/* ── Почему выбирают нас ───────────────────────────────────────── */}
            <section className="pt-8">
                <h2 className="px-4 pb-3 font-heading text-[22px] font-medium">
                    Почему выбирают нас
                </h2>
                <div className="noscroll flex gap-3 overflow-x-auto px-4 pb-1">
                    {OFFERS.map(offer => (
                        <article
                            key={offer.title}
                            className="card w-[290px] shrink-0 bg-gradient-to-br from-surface
                                to-[#1a2336] p-4"
                        >
                            <p className="text-[11px] uppercase tracking-wider text-accent-300">
                                {offer.tag}
                            </p>
                            <h3 className="mt-1.5 font-heading text-[16px] font-medium">
                                {offer.title}
                            </h3>
                            <p className="mt-1.5 text-[12.5px] leading-relaxed text-text/60">
                                {offer.desc}
                            </p>
                        </article>
                    ))}
                </div>
            </section>

            {/* ── Как мы готовим ────────────────────────────────────────────── */}
            <section className="pt-8">
                <h2 className="px-4 pb-3 font-heading text-[22px] font-medium">Как мы готовим</h2>
                <div className="noscroll flex gap-3 overflow-x-auto px-4 pb-1">
                    {STEPS.map(step => (
                        <article key={step.num} className="card relative w-[220px] shrink-0 p-4">
                            <span
                                aria-hidden="true"
                                className="absolute right-3 top-2 font-heading text-[40px]
                                    font-medium leading-none text-text/8"
                            >
                                {step.num}
                            </span>
                            <h3 className="font-heading text-[15px] font-medium">{step.title}</h3>
                            <p className="mt-1.5 text-[12.5px] leading-relaxed text-text/60">
                                {step.desc}
                            </p>
                        </article>
                    ))}
                </div>
            </section>

            {/* ── Вопросы и ответы ──────────────────────────────────────────── */}
            <section className="px-4 pb-10 pt-8">
                <h2 className="pb-3 font-heading text-[22px] font-medium">Вопросы и ответы</h2>
                <FaqAccordion items={FAQS} />
            </section>
        </>
    );
}

function SubTab({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-current={active ? 'true' : undefined}
            className={`shrink-0 whitespace-nowrap border-b-2 py-3 font-heading text-[14px]
                transition-colors
                ${active ? 'border-accent text-accent' : 'border-transparent text-text/55 hover:text-text'}`}
        >
            {label}
        </button>
    );
}
