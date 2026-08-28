import Link from 'next/link';

export const metadata = { title: 'Заказ оформлен — Заморозка' };

export default async function OrderPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;

    return (
        <div className="px-4 py-16 text-center">
            <div
                aria-hidden="true"
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-full
                    border border-accent text-[24px] text-accent"
            >
                ✓
            </div>

            <h1 className="pt-5 font-heading text-[24px] font-medium">Заказ оформлен</h1>
            <p className="pt-2 text-[13.5px] leading-relaxed text-text/60">
                Номер заказа{' '}
                <span className="font-heading font-semibold text-accent-300">{code}</span>.
                <br />
                Напишем вам, когда соберём и передадим курьеру.
            </p>

            <Link
                href="/"
                className="mt-6 inline-block rounded-md border border-divider px-5 py-2.5
                    font-heading text-[14px] text-text/80 hover:border-accent hover:text-accent"
            >
                В каталог
            </Link>
        </div>
    );
}
