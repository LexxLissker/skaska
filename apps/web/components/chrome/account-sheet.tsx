'use client';

import { useState } from 'react';

import { formatPhone, isPhoneComplete } from '@/lib/format';

const DOCUMENTS = [
    { label: 'Публичная оферта', href: '/docs/oferta' },
    { label: 'Политика конфиденциальности', href: '/docs/privacy' },
    { label: 'Согласие на обработку персональных данных', href: '/docs/consent' },
    { label: 'Условия доставки и возврата', href: '/docs/delivery' },
];

/**
 * Нижняя шторка «аккаунт и документы».
 *
 * Вход по номеру телефона с SMS-кодом отключён: шлюза пока нет, и показывать
 * форму, которая не отправит код, — обманывать покупателя. Разметка входа
 * появится вместе с интеграцией провайдера.
 */
export function AccountSheet({ onClose }: { onClose: () => void }) {
    const [cookieOpen, setCookieOpen] = useState(false);
    const [analytics, setAnalytics] = useState(false);
    const [phone, setPhone] = useState({ display: '', digits: '' });

    const loginEnabled = process.env.NEXT_PUBLIC_PHONE_LOGIN_ENABLED === 'true';

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            <button
                type="button"
                aria-label="Закрыть меню"
                onClick={onClose}
                className="absolute inset-0 bg-black/60"
            />

            <div className="relative w-full max-w-[480px] rounded-t-[16px] border-t border-divider bg-surface px-4 pb-6 pt-4">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-heading text-[22px] font-medium">Меню</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Закрыть"
                        className="px-2 text-xl text-text/55 hover:text-accent"
                    >
                        ×
                    </button>
                </div>

                <section className="card mb-3 p-4">
                    <h3 className="mb-2 text-[15px] font-medium">Мои заказы</h3>
                    {loginEnabled ? (
                        <div className="flex gap-2">
                            <input
                                inputMode="tel"
                                value={phone.display}
                                onChange={e => setPhone(formatPhone(e.target.value))}
                                placeholder="+7 (___) ___-__-__"
                                aria-label="Номер телефона"
                                className="min-h-9 w-full rounded-md border border-divider bg-surface-2
                                    px-3 text-sm placeholder:text-text/45 focus-visible:border-accent"
                            />
                            <button
                                type="button"
                                disabled={!isPhoneComplete(phone.digits)}
                                className="btn-gradient shrink-0 rounded-md px-4 font-heading
                                    text-[14px] font-medium disabled:is-disabled"
                            >
                                Код
                            </button>
                        </div>
                    ) : (
                        <p className="text-[13px] leading-relaxed text-text/55">
                            Личный кабинет скоро откроем. Статус заказа пришлём в сообщении на
                            указанный при оформлении номер.
                        </p>
                    )}
                </section>

                <section className="card p-4">
                    <h3 className="mb-2 text-[15px] font-medium">Документы</h3>
                    <ul className="flex flex-col">
                        {DOCUMENTS.map(doc => (
                            <li key={doc.href}>
                                <a
                                    href={doc.href}
                                    className="flex items-center justify-between border-b border-divider
                                        py-2.5 text-[13.5px] text-text hover:text-accent"
                                >
                                    {doc.label}
                                    <span aria-hidden="true" className="text-text/45">
                                        ›
                                    </span>
                                </a>
                            </li>
                        ))}
                    </ul>

                    <button
                        type="button"
                        onClick={() => setCookieOpen(o => !o)}
                        aria-expanded={cookieOpen}
                        className="mt-3 flex w-full items-center justify-between text-[12px] text-text/50
                            hover:text-accent"
                    >
                        Настройки cookie
                        <span
                            aria-hidden="true"
                            className={`transition-transform ${cookieOpen ? 'rotate-180' : ''}`}
                        >
                            ⌄
                        </span>
                    </button>

                    {cookieOpen && (
                        <label className="mt-2 flex items-center justify-between text-[13px] text-text/70">
                            Аналитические cookie
                            <input
                                type="checkbox"
                                checked={analytics}
                                onChange={e => setAnalytics(e.target.checked)}
                                className="h-4 w-4 accent-[#E5B84B]"
                            />
                        </label>
                    )}
                </section>
            </div>
        </div>
    );
}
