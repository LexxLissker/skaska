'use client';

import { useEffect, useRef, useState, type TouchEvent } from 'react';

import { ImagePlaceholder } from './image-placeholder';

const AUTOPLAY_DELAY = 7000;
const SWIPE_DISTANCE = 45;

export interface CatalogHeroSlide {
    id: string;
    eyebrow: string;
    title: string;
    description: string;
    controlTitle: string;
    controlText: string;
    assetUrl: string | null;
}

/** Верхняя витрина: самостоятельная карусель, не связанная с фильтром каталога. */
export function CatalogHeroCarousel({ slides }: { slides: CatalogHeroSlide[] }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const touchStart = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (paused || slides.length < 2) return;

        const timer = window.setInterval(() => {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            setActiveIndex(index => (index + 1) % slides.length);
        }, AUTOPLAY_DELAY);

        return () => window.clearInterval(timer);
    }, [paused, slides.length]);

    function onTouchStart(event: TouchEvent<HTMLElement>) {
        const point = event.touches[0];
        if (point) touchStart.current = { x: point.clientX, y: point.clientY };
    }

    function onTouchEnd(event: TouchEvent<HTMLElement>) {
        const start = touchStart.current;
        touchStart.current = null;
        const point = event.changedTouches[0];
        if (!start || !point || slides.length < 2) return;

        const dx = point.clientX - start.x;
        const dy = point.clientY - start.y;
        if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) <= Math.abs(dy) * 1.25) return;

        setActiveIndex(index =>
            dx < 0
                ? (index + 1) % slides.length
                : (index - 1 + slides.length) % slides.length,
        );
    }

    return (
        <section
            aria-label="Главная витрина"
            aria-roledescription="карусель"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={event => {
                if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className="relative h-[580px] w-full overflow-hidden [touch-action:pan-y]
                lg:mx-auto lg:mt-6 lg:h-[520px] lg:w-[calc(100%_-_64px)] lg:max-w-[1216px]
                lg:rounded-[24px] lg:border lg:border-divider"
        >
            {slides.map((slide, index) => {
                const active = index === activeIndex;
                return (
                    <article
                        key={slide.id}
                        aria-hidden={!active}
                        aria-roledescription="слайд"
                        aria-label={`${index + 1} из ${slides.length}`}
                        className={`absolute inset-0 will-change-[opacity,transform]
                            transition-[opacity,transform] duration-[900ms]
                            ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none
                            ${active ? 'z-[1] scale-100 opacity-100' : 'pointer-events-none scale-[1.025] opacity-0'}`}
                    >
                        <ImagePlaceholder
                            src={slide.assetUrl}
                            alt={slide.title}
                            className="h-full w-full"
                            placeholder="Фото/видео слайда"
                        />
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0
                                [background:linear-gradient(to_bottom,color-mix(in_srgb,var(--color-bg)_18%,transparent)_0%,color-mix(in_srgb,var(--color-bg)_28%,transparent)_42%,color-mix(in_srgb,var(--color-bg)_96%,transparent)_100%)]
                                lg:[background:linear-gradient(to_right,color-mix(in_srgb,var(--color-bg)_97%,transparent)_0%,color-mix(in_srgb,var(--color-bg)_76%,transparent)_43%,color-mix(in_srgb,var(--color-bg)_10%,transparent)_80%)]"
                        />
                        <div className="pointer-events-none absolute inset-x-0 bottom-[118px] px-5
                            lg:bottom-auto lg:left-0 lg:right-auto lg:top-1/2 lg:w-[56%]
                            lg:-translate-y-[62%] lg:px-14">
                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent
                                lg:text-[12px] lg:tracking-[0.18em]">
                                {slide.eyebrow}
                            </p>
                            <h2 className="mb-3 text-[28px] font-medium leading-[1.08] text-[#eef6ff] text-pretty
                                lg:mb-5 lg:text-[48px] lg:leading-[1.05]">
                                {slide.title}
                            </h2>
                            <p className="m-0 max-w-[92%] text-[13.5px] leading-[1.55] text-[#eef6ff]/80 text-pretty
                                lg:max-w-[540px] lg:text-[17px] lg:leading-[1.65]">
                                {slide.description}
                            </p>
                        </div>
                    </article>
                );
            })}

            <div className="absolute inset-x-4 bottom-4 z-[2] grid grid-cols-3 border-t border-text/25
                lg:inset-x-10 lg:bottom-5 lg:gap-4">
                {slides.map((slide, index) => {
                    const active = index === activeIndex;
                    return (
                        <button
                            key={slide.id}
                            type="button"
                            onClick={() => setActiveIndex(index)}
                            aria-label={`Показать слайд «${slide.controlTitle}»`}
                            aria-current={active ? 'true' : undefined}
                            className={`relative min-w-0 cursor-pointer px-2 pb-1 pt-3 text-left transition-colors
                                before:absolute before:-top-px before:left-0 before:h-[3px] before:rounded-full
                                before:bg-accent before:transition-[width,opacity] before:duration-300
                                lg:px-3 lg:pb-2 lg:pt-4
                                ${active ? 'text-text before:w-full before:opacity-100' : 'text-text/55 before:w-0 before:opacity-0 hover:text-text/80'}`}
                        >
                            <span className="block truncate font-heading text-[11px] font-medium lg:text-[15px]">
                                {slide.controlTitle}
                            </span>
                            <span className="mt-1 hidden truncate text-[11px] text-current/75 lg:block">
                                {slide.controlText}
                            </span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
