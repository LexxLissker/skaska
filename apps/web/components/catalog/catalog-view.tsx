'use client';

import { useEffect, useRef, useState, useTransition, type TouchEvent } from 'react';

import { loadProducts } from '@/app/actions/catalog';
import type { BundleOffer, Category, ProductCard as ProductCardType } from '@/lib/api/catalog';
import { FAQS, OFFERS, REVIEWS, STEPS } from '@/lib/content';
import { BundleRail } from './bundle-rail';
import { CatalogNav } from './catalog-nav';
import { FaqAccordion } from './faq-accordion';
import { ImagePlaceholder } from './image-placeholder';
import { ProductCard } from './product-card';
import { ReviewRail } from './review-rail';

/** В сетке сначала 6 карточек, «Показать ещё» открывает по две. */
const INITIAL_VISIBLE = 6;
const VISIBLE_STEP = 2;

/** Порог появления липкой панели — из обработчика прокрутки в прототипе. */
const DOCK_THRESHOLD = 790;
const SWIPE_DISTANCE = 55;

interface Props {
    categories: Category[];
    initialCategorySlug: string;
    initialSubSlug: string | null;
    initialProducts: ProductCardType[];
    bundles: BundleOffer[];
}

export function CatalogView({
    categories,
    initialCategorySlug,
    initialSubSlug,
    initialProducts,
    bundles,
}: Props) {
    const [activeCategory, setActiveCategory] = useState(initialCategorySlug);
    const [activeSub, setActiveSub] = useState<string | null>(initialSubSlug);
    const [products, setProducts] = useState(initialProducts);
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
    const [docked, setDocked] = useState(false);
    const [pending, startTransition] = useTransition();

    const catalogRef = useRef<HTMLDivElement>(null);
    const touchStart = useRef<{ x: number; y: number } | null>(null);

    const category = categories.find(c => c.slug === activeCategory) ?? categories[0];
    const subcategory = category.children.find(s => s.slug === activeSub) ?? null;

    // Панель показывается, пока каталог в поле зрения: после порога прокрутки
    // и до того, как блок с товарами уйдёт вверх целиком.
    useEffect(() => {
        const updateDock = () => {
            const node = catalogRef.current;
            const hideAt = node ? node.offsetTop + node.offsetHeight : Infinity;
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const shouldDock = scrollTop > DOCK_THRESHOLD && scrollTop < hideAt;
            setDocked(current => (current === shouldDock ? current : shouldDock));
        };

        // На телефонах прокрутка может приходить как на window, так и на
        // корневой документ. Слушаем оба источника — это повторяет поведение
        // отдельного scroll-контейнера в исходном прототипе.
        window.addEventListener('scroll', updateDock, { passive: true });
        document.addEventListener('scroll', updateDock, { passive: true, capture: true });
        window.addEventListener('resize', updateDock);

        const observer = new ResizeObserver(updateDock);
        if (catalogRef.current) observer.observe(catalogRef.current);
        requestAnimationFrame(updateDock);

        return () => {
            window.removeEventListener('scroll', updateDock);
            document.removeEventListener('scroll', updateDock, true);
            window.removeEventListener('resize', updateDock);
            observer.disconnect();
        };
    }, []);

    /** Смена категории открывает её первую подкатегорию и сбрасывает сетку. */
    function selectCategory(categorySlug: string) {
        const next = categories.find(c => c.slug === categorySlug);
        switchTo(categorySlug, next?.children[0]?.slug ?? null);
    }

    function switchTo(categorySlug: string, subSlug: string | null) {
        setActiveCategory(categorySlug);
        setActiveSub(subSlug);
        setVisibleCount(INITIAL_VISIBLE);

        startTransition(async () => {
            setProducts(await loadProducts(subSlug ?? categorySlug));
        });
    }

    /**
     * Свайп внутри блока каталога листает только главные категории. Это не
     * карусель подкатегорий: их, как и в оригинальном прототипе, выбирают табом.
     */
    function onCatalogTouchStart(event: TouchEvent<HTMLDivElement>) {
        const point = event.touches[0];
        if (point) touchStart.current = { x: point.clientX, y: point.clientY };
    }

    function onCatalogTouchEnd(event: TouchEvent<HTMLDivElement>) {
        const start = touchStart.current;
        touchStart.current = null;
        const point = event.changedTouches[0];
        if (!start || !point) return;

        const dx = point.clientX - start.x;
        const dy = point.clientY - start.y;
        if (Math.abs(dx) <= SWIPE_DISTANCE || Math.abs(dx) <= Math.abs(dy) * 1.4) return;

        const currentIndex = categories.findIndex(item => item.slug === activeCategory);
        const nextIndex = Math.max(
            0,
            Math.min(categories.length - 1, currentIndex + (dx < 0 ? 1 : -1)),
        );
        const next = categories[nextIndex];
        if (next && next.slug !== activeCategory) selectCategory(next.slug);
    }

    const visible = products.slice(0, visibleCount);
    const reviews = REVIEWS[category.slug] ?? REVIEWS.pelmeni;

    return (
        <>
            {/* ── Герой категории: 580px с затемнением к низу ────────────────── */}
            <header className="relative h-[580px] w-full">
                <ImagePlaceholder
                    src={category.assetUrl}
                    alt={category.name}
                    className="h-full w-full"
                    placeholder="Фото/видео блюда"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0
                        [background:linear-gradient(to_bottom,transparent_58%,color-mix(in_srgb,var(--color-bg)_92%,transparent)_100%)]"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-[22px]">
                    <h1 className="mb-2 text-center text-[24px] text-[#eef6ff] text-pretty">
                        {category.name}
                    </h1>
                    <p className="m-0 text-center text-[13.5px] leading-[1.5] text-[#eef6ff] opacity-[0.82] text-pretty">
                        {category.description}
                    </p>
                </div>
            </header>

            {/* Навигация наезжает на герой и растворяется в фоне. */}
            <div
                className="relative z-[2] -mt-4 pt-10
                    [background:linear-gradient(to_bottom,transparent_0,var(--color-bg)_50px,var(--color-bg)_100%)]"
            >
                <CatalogNav
                    categories={categories}
                    activeCategory={activeCategory}
                    activeSub={activeSub}
                    onCategory={selectCategory}
                    onSub={slug => switchTo(activeCategory, slug)}
                />
            </div>

            {/* ── Липкая панель: внизу, над навигацией ───────────────────────── */}
            <div
                className={`fixed inset-x-0 bottom-16 z-20 mx-auto w-full max-w-[412px] bg-bg pt-2.5
                    shadow-[0_-1px_0_var(--color-divider)]
                    [transition:transform_.32s_cubic-bezier(0.22,1,0.36,1),opacity_.28s_ease]
                    ${docked ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-[14px] opacity-0'}`}
                aria-hidden={!docked}
            >
                <CatalogNav
                    categories={categories}
                    activeCategory={activeCategory}
                    activeSub={activeSub}
                    onCategory={selectCategory}
                    onSub={slug => switchTo(activeCategory, slug)}
                />
            </div>

            <div
                ref={catalogRef}
                onTouchStart={onCatalogTouchStart}
                onTouchEnd={onCatalogTouchEnd}
            >
                {/* ── Баннер подкатегории: 414px ─────────────────────────────── */}
                {subcategory && (
                    <section className="relative mb-1 mt-[14px] h-[414px] w-full overflow-hidden">
                        <ImagePlaceholder
                            src={subcategory.assetUrl}
                            alt={subcategory.name}
                            className="h-full w-full"
                            placeholder="Фото/видео подкатегории"
                        />
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0
                                [background:linear-gradient(to_bottom,transparent_40%,color-mix(in_srgb,var(--color-bg)_92%,transparent)_100%)]"
                        />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-6 pt-5">
                            <h3 className="mb-2 text-[19px] text-[#eef6ff]">
                                {category.name}, {subcategory.name}
                            </h3>
                            <p className="m-0 max-w-[88%] text-[13.5px] leading-[1.55] text-[#eef6ff] opacity-[0.82]">
                                {subcategory.description}
                            </p>
                        </div>
                    </section>
                )}

                {/* ── Сетка товаров ──────────────────────────────────────────── */}
                <section className="px-4" aria-busy={pending}>
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
                                    className="btn btn-secondary btn-block mt-4 h-11"
                                >
                                    Показать ещё
                                </button>
                            )}
                        </>
                    )}
                </section>
            </div>

            {/* ── Наборы для дома ───────────────────────────────────────────── */}
            <BundleRail offers={bundles} />

            {/* ── Отзывы ────────────────────────────────────────────────────── */}
            <ReviewRail reviews={reviews} />

            {/* ── Почему выбирают нас ───────────────────────────────────────── */}
            <section className="px-4 pb-1 pt-[22px]">
                <h2 className="mb-3 text-[22px] font-medium">Почему выбирают нас</h2>
                <div className="noscroll flex gap-[14px] overflow-x-auto pb-1.5">
                    {OFFERS.map(offer => (
                        <article
                            key={offer.title}
                            className="relative w-[78%] shrink-0 overflow-hidden rounded-lg border
                                border-accent p-[18px]
                                [background:linear-gradient(135deg,color-mix(in_srgb,var(--color-accent)_16%,var(--color-surface))_0%,var(--color-surface)_70%)]"
                        >
                            <span
                                aria-hidden="true"
                                className="absolute -right-[22px] -top-[22px] h-[100px] w-[100px]
                                    rounded-full bg-[color-mix(in_srgb,var(--color-accent)_20%,transparent)] blur-[2px]"
                            />
                            <span className="tag tag-accent relative inline-block">{offer.tag}</span>
                            <h3 className="relative mb-1.5 mt-2.5 text-[16px] font-medium">
                                {offer.title}
                            </h3>
                            <p className="relative m-0 text-[12.5px] leading-[1.5] text-text/80 text-pretty">
                                {offer.desc}
                            </p>
                        </article>
                    ))}
                </div>
            </section>

            {/* ── Как мы готовим ────────────────────────────────────────────── */}
            <section className="px-4 pb-1 pt-[22px]">
                <h2 className="mb-3 text-[22px] font-medium">Как мы готовим</h2>
                <div className="noscroll flex gap-[14px] overflow-x-auto pb-1.5">
                    {STEPS.map(step => (
                        <article
                            key={step.num}
                            className="relative w-[78%] shrink-0 overflow-hidden rounded-lg border
                                border-divider p-5
                                [background:linear-gradient(155deg,color-mix(in_srgb,var(--color-accent)_14%,var(--color-surface))_0%,var(--color-surface)_65%)]"
                        >
                            <span
                                aria-hidden="true"
                                className="absolute -right-[18px] -top-[18px] h-[90px] w-[90px]
                                    rounded-full bg-[color-mix(in_srgb,var(--color-accent)_20%,transparent)] blur-[2px]"
                            />
                            <div className="relative mb-4 flex items-center justify-between">
                                <span className="flex h-11 w-11 items-center justify-center rounded-full
                                    border border-accent bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] text-accent">
                                    <StepIcon number={step.num} />
                                </span>
                                <span className="font-heading text-[34px] font-medium text-text/20">
                                    {String(step.num).padStart(2, '0')}
                                </span>
                            </div>
                            <h3 className="relative mb-1.5 text-[15px] font-medium">{step.title}</h3>
                            <p className="relative text-[12.5px] leading-[1.5] text-text/75">
                                {step.desc}
                            </p>
                        </article>
                    ))}
                </div>
            </section>

            {/* ── Вопросы и ответы ──────────────────────────────────────────── */}
            <section className="px-4 pb-10 pt-8">
                <h2 className="mb-3 text-[22px] font-medium">Вопросы и ответы</h2>
                <FaqAccordion items={FAQS} />
            </section>
        </>
    );
}

function StepIcon({ number }: { number: number }) {
    if (number === 1) {
        return (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M8 9V6a4 4 0 0 1 8 0v3M5 9h14v11H5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }
    if (number === 2) {
        return (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 11a4 4 0 0 1 4-4h2l2-2 2 2h1a4 4 0 0 1 4 4c0 4-6 8-8 9-2-1-7-5-7-9z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
        );
    }
    if (number === 3) {
        return (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3v18M5 6l14 12M5 18 19 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
        );
    }
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m12 3 8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="m8.5 12 2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
