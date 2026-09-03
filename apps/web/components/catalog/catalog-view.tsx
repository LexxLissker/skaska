'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type TouchEvent } from 'react';

import type { BundleOffer, Category, ProductCard as ProductCardType } from '@/lib/api/catalog';
import { categoryHref } from '@/lib/catalog-routes';
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
    activeCategorySlug: string;
    activeSubSlug: string | null;
    products: ProductCardType[];
    bundles: BundleOffer[];
}

export function CatalogView({
    categories,
    activeCategorySlug,
    activeSubSlug,
    products,
    bundles,
}: Props) {
    const router = useRouter();
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
    const [docked, setDocked] = useState(false);

    const catalogRef = useRef<HTMLDivElement>(null);
    const touchStart = useRef<{ x: number; y: number } | null>(null);

    const initialVisibleForViewport = () =>
        typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
            ? 8
            : INITIAL_VISIBLE;

    const category = categories.find(c => c.slug === activeCategorySlug) ?? categories[0];
    const subcategory = category.children.find(s => s.slug === activeSubSlug) ?? null;

    // Панель показывается, пока каталог в поле зрения: после порога прокрутки
    // и до того, как блок с товарами уйдёт вверх целиком.
    useEffect(() => {
        setVisibleCount(initialVisibleForViewport());
    }, [activeCategorySlug, activeSubSlug]);

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

    /**
     * Свайп внутри блока каталога листает только главные категории. Это не
     * карусель подкатегорий: каждая категория открывается по своему URL.
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

        const currentIndex = categories.findIndex(item => item.slug === activeCategorySlug);
        const nextIndex = Math.max(
            0,
            Math.min(categories.length - 1, currentIndex + (dx < 0 ? 1 : -1)),
        );
        const next = categories[nextIndex];
        if (next && next.slug !== activeCategorySlug) {
            router.push(categoryHref(next.slug), { scroll: false });
        }
    }

    const visible = products.slice(0, visibleCount);
    const reviews = REVIEWS[category.slug] ?? REVIEWS.pelmeni;

    return (
        <>
            {/* ── Герой категории: 580px с затемнением к низу ────────────────── */}
            <header className="relative h-[580px] w-full lg:mx-auto lg:mt-6 lg:h-[520px]
                lg:w-[calc(100%_-_64px)] lg:max-w-[1216px] lg:overflow-hidden lg:rounded-[24px]
                lg:border lg:border-divider">
                <ImagePlaceholder
                    src={category.assetUrl}
                    alt={category.name}
                    className="h-full w-full"
                    placeholder="Фото/видео блюда"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0
                        [background:linear-gradient(to_bottom,transparent_58%,color-mix(in_srgb,var(--color-bg)_92%,transparent)_100%)]
                        lg:[background:linear-gradient(to_right,color-mix(in_srgb,var(--color-bg)_96%,transparent)_0%,color-mix(in_srgb,var(--color-bg)_72%,transparent)_42%,color-mix(in_srgb,var(--color-bg)_8%,transparent)_78%)]"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-[22px]
                    lg:bottom-auto lg:left-0 lg:right-auto lg:top-1/2 lg:w-[52%] lg:-translate-y-1/2
                    lg:px-14 lg:pb-0">
                    <p className="mb-3 hidden text-[12px] font-medium uppercase tracking-[0.18em] text-accent lg:block">
                        Ручная лепка · доставка по расписанию
                    </p>
                    <h1 className="mb-2 text-center text-[24px] text-[#eef6ff] text-pretty
                        lg:mb-5 lg:text-left lg:text-[48px] lg:leading-[1.05]">
                        {category.name}
                    </h1>
                    <p className="m-0 text-center text-[13.5px] leading-[1.5] text-[#eef6ff] opacity-[0.82] text-pretty
                        lg:max-w-[520px] lg:text-left lg:text-[17px] lg:leading-[1.65]">
                        {category.description}
                    </p>
                </div>
            </header>

            {/* ── Липкая панель: внизу, над навигацией ───────────────────────── */}
            <div
                className={`fixed inset-x-0 bottom-16 z-20 mx-auto w-full max-w-[412px] bg-bg pt-2.5
                    shadow-[0_-1px_0_var(--color-divider)]
                    [transition:transform_.32s_cubic-bezier(0.22,1,0.36,1),opacity_.28s_ease]
                    lg:hidden
                    ${docked ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-[14px] opacity-0'}`}
                aria-hidden={!docked}
                inert={!docked}
            >
                <CatalogNav
                    categories={categories}
                    activeCategory={activeCategorySlug}
                    activeSub={activeSubSlug}
                />
            </div>

            <div
                ref={catalogRef}
                id="catalog"
                onTouchStart={onCatalogTouchStart}
                onTouchEnd={onCatalogTouchEnd}
                className="scroll-mt-24 lg:mx-auto lg:max-w-[1280px]"
            >
                {/* Навигация на телефоне наезжает на герой, на ПК закрепляется под шапкой. */}
                <div
                    className="relative z-[2] -mt-4 pt-10
                        [background:linear-gradient(to_bottom,transparent_0,var(--color-bg)_50px,var(--color-bg)_100%)]
                        lg:sticky lg:top-[72px] lg:z-30 lg:mt-0
                        lg:bg-[color-mix(in_srgb,var(--color-bg)_94%,transparent)] lg:px-4 lg:pb-1 lg:pt-4 lg:backdrop-blur-xl"
                >
                    <CatalogNav
                        categories={categories}
                        activeCategory={activeCategorySlug}
                        activeSub={activeSubSlug}
                    />
                </div>

                {/* ── Баннер подкатегории: 414px ─────────────────────────────── */}
                {subcategory && (
                    <section className="relative mb-1 mt-[14px] h-[414px] w-full overflow-hidden
                        lg:mx-8 lg:mb-6 lg:mt-6 lg:h-[340px] lg:w-auto lg:rounded-[20px]
                        lg:border lg:border-divider">
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
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-6 pt-5 lg:px-9 lg:pb-8">
                            <h3 className="mb-2 text-[19px] text-[#eef6ff] lg:text-[28px]">
                                {category.name}, {subcategory.name}
                            </h3>
                            <p className="m-0 max-w-[88%] text-[13.5px] leading-[1.55] text-[#eef6ff] opacity-[0.82]
                                lg:max-w-[680px] lg:text-[15px]">
                                {subcategory.description}
                            </p>
                        </div>
                    </section>
                )}

                {/* ── Сетка товаров ──────────────────────────────────────────── */}
                <section className="px-4 lg:px-8 lg:pb-4">
                    {products.length === 0 ? (
                        <p className="py-10 text-center text-[13px] text-text/45">
                            В этой подкатегории пока нет товаров
                        </p>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
                                {visible.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>

                            {visibleCount < products.length && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setVisibleCount(c =>
                                            c + (window.matchMedia('(min-width: 1024px)').matches ? 4 : VISIBLE_STEP),
                                        )
                                    }
                                    className="btn btn-secondary btn-block mt-4 h-11 lg:mx-auto lg:mt-6 lg:max-w-[360px]"
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
            <section id="delivery" className="scroll-mt-24 px-4 pb-1 pt-[22px] lg:mx-auto lg:max-w-[1280px] lg:px-8 lg:pt-12">
                <h2 className="mb-3 text-[22px] font-medium lg:mb-5 lg:text-[30px]">Почему выбирают нас</h2>
                <div className="noscroll flex gap-[14px] overflow-x-auto pb-1.5 lg:grid lg:grid-cols-2 lg:overflow-visible">
                    {OFFERS.map(offer => (
                        <article
                            key={offer.title}
                            className="relative w-[78%] shrink-0 overflow-hidden rounded-lg border
                                border-divider bg-surface p-[18px] transition-colors hover:border-accent/60
                                lg:w-auto lg:min-h-[190px] lg:p-7"
                        >
                            <span className="tag tag-accent relative inline-block">{offer.tag}</span>
                            <h3 className="relative mb-1.5 mt-2.5 text-[16px] font-medium lg:text-[21px]">
                                {offer.title}
                            </h3>
                            <p className="relative m-0 text-[12.5px] leading-[1.5] text-text/80 text-pretty lg:max-w-[470px] lg:text-[14px] lg:leading-[1.65]">
                                {offer.desc}
                            </p>
                        </article>
                    ))}
                </div>
            </section>

            {/* ── Как мы готовим ────────────────────────────────────────────── */}
            <section id="how-we-cook" className="scroll-mt-24 px-4 pb-1 pt-[22px] lg:mx-auto lg:max-w-[1280px] lg:px-8 lg:pt-12">
                <h2 className="mb-3 text-[22px] font-medium lg:mb-5 lg:text-[30px]">Как мы готовим</h2>
                <div className="noscroll flex gap-[14px] overflow-x-auto pb-1.5 lg:grid lg:grid-cols-4 lg:overflow-visible">
                    {STEPS.map(step => (
                        <article
                            key={step.num}
                            className="relative w-[78%] shrink-0 overflow-hidden rounded-lg border
                                border-divider bg-surface p-5 transition-colors hover:border-accent/50
                                lg:w-auto lg:min-h-[230px] lg:p-6"
                        >
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
            <section className="px-4 pb-10 pt-8 lg:mx-auto lg:max-w-[900px] lg:px-8 lg:pb-20 lg:pt-16">
                <h2 className="mb-3 text-[22px] font-medium lg:mb-5 lg:text-center lg:text-[30px]">Вопросы и ответы</h2>
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
