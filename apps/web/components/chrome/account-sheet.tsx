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
 * Нижняя шторка «Меню»: заказы и юридические документы.
 *
 * Вход по телефону включается фичефлагом: без SMS-шлюза форма, которая
 * не отправит код, вводила бы покупателя в заблуждение.
 */
export function AccountSheet({ onClose }: { onClose: () => void }) {
    const [cookieOpen, setCookieOpen] = useState(false);
    const [analytics, setAnalytics] = useState(false);
    const [phone, setPhone] = useState({ display: '', digits: '' });

    const loginEnabled = process.env.NEXT_PUBLIC_PHONE_LOGIN_ENABLED === 'true';

    return (
        <div className="fixed inset-0 z-[42] flex items-end justify-center bg-[color-mix(in_srgb,var(--color-bg)_60%,transparent)]">
            <button
                type="button"
                aria-label="Закрыть меню"
                onClick={onClose}
                className="absolute inset-0"
            />

            <div className="relative max-h-[80%] w-full max-w-[412px] overflow-y-auto rounded-t-[20px] bg-surface px-[18px] pb-[26px] pt-5">
                <div className="mb-4 flex items-center justify-between">
                    <span className="font-heading text-[16px] font-medium text-text">Меню</span>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Закрыть"
                        className="flex p-1 text-[#a5b8de]"
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            aria-hidden="true"
                        >
                            <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                    </button>
                </div>

                {/* ── Мои заказы ────────────────────────────────────────────── */}
                <div className="mb-4 rounded-md bg-surface-2 p-3.5">
                    <p className="mb-2 text-[14.5px] font-medium text-text">Мои заказы</p>

                    {loginEnabled ? (
                        <>
                            <p className="mb-2.5 text-[12.5px] leading-[1.5] text-text/60">
                                Войдите по номеру телефона — здесь появятся заказы и повтор заказа
                            </p>
                            <div className="flex gap-2">
                                <input
                                    className="input flex-1"
                                    inputMode="tel"
                                    placeholder="+7 (___) ___-__-__"
                                    aria-label="Номер телефона"
                                    value={phone.display}
                                    onChange={e => setPhone(formatPhone(e.target.value))}
                                />
                                <button
                                    type="button"
                                    disabled={!isPhoneComplete(phone.digits)}
                                    className="btn btn-primary h-11 shrink-0 px-4 disabled:is-disabled"
                                >
                                    Код
                                </button>
                            </div>
                        </>
                    ) : (
                        <p className="text-[12.5px] leading-[1.5] text-text/60">
                            Личный кабинет скоро откроем. Статус заказа пришлём в сообщении на
                            указанный при оформлении номер.
                        </p>
                    )}
                </div>

                {/* ── Документы ─────────────────────────────────────────────── */}
                <div className="flex flex-col">
                    {DOCUMENTS.map(doc => (
                        <a
                            key={doc.href}
                            href={doc.href}
                            className="flex items-center justify-between border-b border-divider
                                px-0.5 py-3 text-[13.5px] text-text hover:text-accent"
                        >
                            <span>{doc.label}</span>
                            <span aria-hidden="true" className="text-[#a5b8de]">
                                ›
                            </span>
                        </a>
                    ))}

                    <button
                        type="button"
                        onClick={() => setCookieOpen(o => !o)}
                        aria-expanded={cookieOpen}
                        className="flex items-center justify-between px-0.5 pb-1 pt-[11px]"
                    >
                        <span className="text-[12px] text-text/55">Настройки cookie</span>
                        <span
                            aria-hidden="true"
                            className={`text-text/55 transition-transform ${cookieOpen ? 'rotate-180' : ''}`}
                        >
                            ⌄
                        </span>
                    </button>

                    {cookieOpen && (
                        <div className="flex items-center justify-between px-0.5 pb-0.5 pt-2.5">
                            <span className="text-[12px] text-text/60">Аналитические cookie</span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={analytics}
                                aria-label="Аналитические cookie"
                                onClick={() => setAnalytics(a => !a)}
                                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors
                                    ${analytics ? 'bg-accent' : 'bg-[#4f5e7b]'}`}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-bg
                                        transition-[left] duration-200
                                        ${analytics ? 'left-[18px]' : 'left-0.5'}`}
                                />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
