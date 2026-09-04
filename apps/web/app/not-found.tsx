import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Страница не найдена',
    description: 'Запрошенная страница не найдена. Вернитесь в каталог домашних полуфабрикатов «Скаска».',
    robots: { index: false, follow: false },
};

export default function NotFoundPage() {
    return (
        <div className="mx-auto flex min-h-[65vh] max-w-[640px] flex-col items-center justify-center px-5 py-16 text-center">
            <p className="font-heading text-[64px] font-medium leading-none text-accent">404</p>
            <h1 className="mt-5 font-heading text-[24px] font-medium lg:text-[34px]">
                Страница не найдена
            </h1>
            <p className="mt-3 max-w-[480px] text-[13.5px] leading-relaxed text-text/60 lg:text-[15px]">
                Возможно, адрес изменился или такой страницы больше нет. Каталог и ваши покупки
                никуда не пропали.
            </p>
            <Link href="/" className="btn btn-primary mt-6 px-6">
                Вернуться в каталог
            </Link>
        </div>
    );
}
