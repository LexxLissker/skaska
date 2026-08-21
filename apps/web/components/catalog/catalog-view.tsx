'use client';

import { useEffect, useRef, useState, useTransition } from 'react';

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

    const category = categories.find(c => c.slug === activeCategory) ?? categories[0];
    const subcategory = category.children.find(s => s.slug === activeSub) ?? null;

    // Панель показывается, пока каталог в поле зрения: после порога прокрутки
    // и до того, как блок с товарами уйдёт вверх целиком.
    useEffect(() => {
        const onScroll = () => {
            const node = catalogRef.current;
            const hideAt = node ? node.offsetTop + node.offsetHeight : Infinity;
            setDocked(window.scrollY > DOCK_THRESHOLD && window.scrollY < hideAt);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
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
                className={`fixed inset-x-0 bottom-16 z-20 mx-auto w-full max-w-[480px] bg-bg pt-2.5
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

            <div ref={catalogRef}>
                {/* ── Баннер подкатегории: 414px ─────────────────────────────── */}
                {subcategory && (
                    <section className="relative mb-1 mt-[14px] h-[414px] w-full overflow-hidden">
                        <ImagePlaceholder
                            src={null}
                            alt={subcategory.name}
                            className="h-full w-full"
                        />
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0
                                [background:linear-gradient(to_bottom,transparent_40%,color-mix(in_srgb,var(--color-bg)_92%,transparent)_100%)]"
                        />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-6 pt-5">
                            <h3 className="mb-2 text-[19px] text-[#eef6ff]">{subcategory.name}</h3>
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
            <section className="pt-8">
                <h2 className="mb-3 px-4 text-[22px] font-medium">Почему выбирают нас</h2>
                <div className="noscroll flex gap-3 overflow-x-auto px-4 pb-1">
                    {OFFERS.map(offer => (
                        <article
                            key={offer.title}
                            className="card w-[290px] shrink-0 bg-gradient-to-br from-surface
                                to-surface-2 p-4"
                        >
                            <span className="tag tag-accent">{offer.tag}</span>
                            <h3 className="mt-2 text-[16px] font-medium">{offer.title}</h3>
                            <p className="mt-1.5 text-[12.5px] leading-relaxed text-text/60">
                                {offer.desc}
                            </p>
                        </article>
                    ))}
                </div>
            </section>

            {/* ── Как мы готовим ────────────────────────────────────────────── */}
            <section className="pt-8">
                <h2 className="mb-3 px-4 text-[22px] font-medium">Как мы готовим</h2>
                <div className="noscroll flex gap-3 overflow-x-auto px-4 pb-1">
                    {STEPS.map(step => (
                        <article key={step.num} className="card relative w-[220px] shrink-0 p-4">
                            <span
                                aria-hidden="true"
                                className="absolute right-3 top-2 font-heading text-[40px]
                                    font-medium leading-none text-text/10"
                            >
                                {String(step.num).padStart(2, '0')}
                            </span>
                            <h3 className="text-[15px] font-medium">{step.title}</h3>
                            <p className="mt-1.5 text-[12.5px] leading-relaxed text-text/60">
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
