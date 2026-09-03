import Link from 'next/link';

export const metadata = { title: 'Документы — Заморозка' };

const DOCUMENTS = [
    {
        id: 'oferta',
        title: 'Публичная оферта',
        description: 'Условия продажи, оформления и оплаты заказов.',
    },
    {
        id: 'privacy',
        title: 'Политика конфиденциальности',
        description: 'Как собираются, используются и защищаются персональные данные.',
    },
    {
        id: 'consent',
        title: 'Согласие на обработку персональных данных',
        description: 'Согласие покупателя на обработку данных для выполнения заказа.',
    },
    {
        id: 'delivery',
        title: 'Условия доставки и возврата',
        description: 'Расписание, стоимость доставки и порядок решения спорных ситуаций.',
    },
];

export default function DocumentsPage() {
    return (
        <div className="px-4 pb-10 pt-5 lg:mx-auto lg:w-full lg:max-w-[960px] lg:px-8 lg:pb-20 lg:pt-10">
            <header className="flex items-center gap-3">
                <Link
                    href="/"
                    aria-label="Назад в каталог"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-divider
                        text-[22px] text-text/70 hover:border-accent hover:text-accent"
                >
                    ‹
                </Link>
                <h1 className="font-heading text-[24px] font-medium lg:text-[34px]">Документы</h1>
            </header>

            <p className="mt-4 text-[13px] leading-relaxed text-text/55 lg:max-w-[640px] lg:text-[15px]">
                Все правила магазина собраны здесь, чтобы их не приходилось искать по меню и
                оформлению заказа.
            </p>

            <section className="mt-5 overflow-hidden rounded-[14px] border border-divider bg-surface lg:mt-8 lg:rounded-[20px]">
                {DOCUMENTS.map((document, index) => (
                    <article
                        id={document.id}
                        key={document.id}
                        className={`scroll-mt-24 px-4 py-4 lg:px-7 lg:py-6 ${index ? 'border-t border-divider' : ''}`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-[14px] font-medium text-text lg:text-[17px]">
                                    {document.title}
                                </h2>
                                <p className="mt-1 text-[12px] leading-relaxed text-text/50 lg:text-[14px]">
                                    {document.description}
                                </p>
                            </div>
                            <span
                                className="shrink-0 rounded-full border border-divider px-2 py-1
                                    text-[10px] text-text/40"
                            >
                                Готовится
                            </span>
                        </div>
                    </article>
                ))}
            </section>

            <p className="mt-4 text-[11.5px] leading-relaxed text-text/40">
                Перед публикацией вместо этих описаний будут размещены утверждённые юридические
                тексты с реквизитами продавца.
            </p>
        </div>
    );
}
