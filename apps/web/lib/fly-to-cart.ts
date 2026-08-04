/**
 * Полёт товара в корзину.
 *
 * Из точки нажатия к иконке корзины летит маленькая точка, после чего иконка
 * пружинит. Смещение считается по фактическим координатам на экране и
 * передаётся в анимацию через CSS-переменные — иначе траектория не совпадёт
 * при другой ширине экрана или прокрутке.
 */
const FLIGHT_MS = 560;
const BUMP_MS = 420;

export function flyToCart(origin: HTMLElement | null): void {
    if (typeof window === 'undefined' || !origin) return;

    // При включённой экономии движения анимацию не показываем.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const cartIcon = document.querySelector<HTMLElement>('[data-cart-icon]');
    if (!cartIcon) return;

    const from = origin.getBoundingClientRect();
    const to = cartIcon.getBoundingClientRect();

    const startX = from.left + from.width / 2;
    const startY = from.top + from.height / 2;
    const dx = to.left + to.width / 2 - startX;
    const dy = to.top + to.height / 2 - startY;

    const dot = document.createElement('span');
    dot.setAttribute('aria-hidden', 'true');
    dot.style.cssText = `
        position: fixed;
        left: ${startX - 7}px;
        top: ${startY - 7}px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: linear-gradient(135deg, #E5B84B 0%, #C59B27 100%);
        box-shadow: 0 0 14px rgba(229, 184, 75, 0.55);
        pointer-events: none;
        z-index: 60;
        --dx: ${dx}px;
        --dy: ${dy}px;
        animation: flyToCart ${FLIGHT_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    `;

    document.body.appendChild(dot);

    window.setTimeout(() => {
        dot.remove();
        cartIcon.style.animation = `cartBump ${BUMP_MS}ms ease-out`;
        window.setTimeout(() => {
            cartIcon.style.animation = '';
        }, BUMP_MS);
    }, FLIGHT_MS);
}
