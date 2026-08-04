/**
 * Изображение товара или категории.
 *
 * В дизайн-прототипе все слоты пустые (`<image-slot>`), реальной съёмки ещё нет.
 * Пока фотографий нет, показываем нейтральную заглушку в тон подложки —
 * это честнее «битой картинки» и не ломает раскладку.
 */
export function ImagePlaceholder({
    src,
    alt,
    className = '',
}: {
    src: string | null;
    alt: string;
    className?: string;
}) {
    if (src) {
        return (
            // Ассеты отдаёт Vendure со своего домена; next/image потребовал бы
            // прописывать его в remotePatterns на каждое окружение.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt} className={`object-cover ${className}`} loading="lazy" />
        );
    }

    return (
        <div
            className={`flex items-center justify-center bg-gradient-to-br from-surface
                to-surface-2 ${className}`}
            role="img"
            aria-label={alt}
        >
            <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                className="text-text/15"
                aria-hidden="true"
            >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="8.5" cy="10" r="1.5" />
                <path d="M21 16l-5-5-4 4-2-2-4 4" />
            </svg>
        </div>
    );
}
