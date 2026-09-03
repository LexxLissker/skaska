'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { confirmPhoneCode, requestPhoneCode } from '@/app/actions/account';
import { formatPhone, isPhoneComplete } from '@/lib/format';

type View = 'menu' | 'phone' | 'code';

export function AccountSheet({
    onClose,
    accountPhone,
}: {
    onClose: () => void;
    accountPhone: string | null;
}) {
    const router = useRouter();
    const [view, setView] = useState<View>('menu');
    const [cookieOpen, setCookieOpen] = useState(false);
    const [analytics, setAnalytics] = useState(false);
    const [phone, setPhone] = useState({ display: '', digits: '' });
    const [code, setCode] = useState('');
    const [message, setMessage] = useState('');
    const [pending, setPending] = useState(false);
    const demoMode = process.env.NEXT_PUBLIC_USE_VENDURE !== 'true';

    function openOrders() {
        if (accountPhone) {
            onClose();
            router.push('/account/orders');
            return;
        }
        setMessage('');
        setView('phone');
    }

    async function sendCode(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!isPhoneComplete(phone.digits) || pending) return;

        setPending(true);
        setMessage('');
        try {
            const result = await requestPhoneCode(phone.digits);
            if (!result.ok) {
                setMessage(result.message);
                return;
            }
            setView('code');
        } catch {
            setMessage('Не удалось отправить код. Попробуйте ещё раз.');
        } finally {
            setPending(false);
        }
    }

    async function confirmCode(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (code.length !== 4 || pending) return;

        setPending(true);
        setMessage('');
        try {
            const result = await confirmPhoneCode(phone.digits, code);
            if (!result.ok) {
                setMessage(result.message);
                return;
            }
            onClose();
            router.push('/account/orders');
            router.refresh();
        } catch {
            setMessage('Не удалось подтвердить код. Попробуйте ещё раз.');
        } finally {
            setPending(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center lg:p-6">
            <button
                type="button"
                aria-label="Закрыть меню"
                onClick={onClose}
                className="absolute inset-0 bg-black/60"
            />

            <div
                className="relative max-h-[82dvh] w-full max-w-[412px] overflow-y-auto rounded-t-[16px]
                    border-t border-divider bg-surface px-4 pb-6 pt-4 lg:max-w-[460px]
                    lg:rounded-[18px] lg:border lg:p-6 lg:shadow-[0_24px_80px_rgba(0,0,0,.6)]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="account-sheet-title"
            >
                <SheetHeader view={view} onBack={() => setView('menu')} onClose={onClose} />

                {view === 'menu' && (
                    <>
                        <button
                            type="button"
                            onClick={openOrders}
                            className="panel mb-2.5 flex min-h-[72px] w-full flex-row items-center gap-3
                                px-3.5 py-3 text-left transition-colors hover:border-accent"
                        >
                            <span
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                                    border border-accent text-accent"
                                aria-hidden="true"
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                >
                                    <circle cx="12" cy="8" r="3.5" />
                                    <path d="M5 20c.7-4 3-6 7-6s6.3 2 7 6" strokeLinecap="round" />
                                </svg>
                            </span>
                            <span className="min-w-0 flex-1">
                                <strong className="block font-heading text-[15px] font-medium">
                                    Мои заказы
                                </strong>
                                <span className="mt-0.5 block truncate text-[12.5px] text-text/55">
                                    {accountPhone ?? 'Войти по номеру телефона'}
                                </span>
                            </span>
                            <span className="text-[22px] text-text/40" aria-hidden="true">
                                ›
                            </span>
                        </button>

                        <div className="overflow-hidden rounded-[14px] border border-divider bg-surface-2/35">
                            <Link
                                href="/docs"
                                onClick={onClose}
                                className="flex min-h-[58px] items-center gap-3 px-3.5 py-2.5
                                    text-left hover:bg-surface-2"
                            >
                                <span
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full
                                        border border-divider text-text/65"
                                    aria-hidden="true"
                                >
                                    <DocumentIcon />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <strong className="block text-[14px] font-medium">Документы</strong>
                                    <span className="mt-0.5 block truncate text-[11.5px] text-text/45">
                                        Оферта, политика и условия доставки
                                    </span>
                                </span>
                                <span className="text-[20px] text-text/35" aria-hidden="true">
                                    ›
                                </span>
                            </Link>

                            <div className="mx-3.5 border-t border-divider" />
                            <button
                                type="button"
                                onClick={() => setCookieOpen(open => !open)}
                                aria-expanded={cookieOpen}
                                className="flex min-h-[48px] w-full items-center justify-between px-3.5
                                    text-[12px] text-text/50 hover:text-accent"
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
                                <label
                                    className="mx-3.5 flex min-h-[44px] items-center justify-between border-t
                                        border-divider text-[12.5px] text-text/65"
                                >
                                    Аналитические cookie
                                    <input
                                        type="checkbox"
                                        checked={analytics}
                                        onChange={event => setAnalytics(event.target.checked)}
                                        className="h-4 w-4 accent-[#E5B84B]"
                                    />
                                </label>
                            )}
                        </div>
                    </>
                )}

                {view === 'phone' && (
                    <form onSubmit={sendCode} className="card p-4">
                        <p className="mb-4 text-[13px] leading-relaxed text-text/60">
                            Введите номер — пришлём одноразовый код. Пароль придумывать не нужно.
                        </p>
                        <label htmlFor="account-phone" className="text-[12px] text-text/65">
                            Номер телефона
                        </label>
                        <input
                            id="account-phone"
                            autoFocus
                            inputMode="tel"
                            autoComplete="tel"
                            value={phone.display}
                            onChange={event => setPhone(formatPhone(event.target.value))}
                            placeholder="+7 (___) ___-__-__"
                            className="mt-1.5 min-h-11 w-full rounded-md border border-divider bg-surface-2
                                px-3 text-[15px] text-text outline-none placeholder:text-text/35
                                focus:border-accent"
                        />
                        {message && (
                            <p className="mt-2 text-[12px] leading-relaxed text-[#f3a8a8]" role="alert">
                                {message}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={!isPhoneComplete(phone.digits) || pending}
                            className="btn-cta mt-4 disabled:is-disabled"
                        >
                            {pending ? 'Отправляем…' : 'Получить код'}
                        </button>
                    </form>
                )}

                {view === 'code' && (
                    <form onSubmit={confirmCode} className="card p-4">
                        <p className="text-[13px] leading-relaxed text-text/60">
                            Код отправлен на <span className="text-text">{phone.display}</span>
                        </p>
                        {demoMode && (
                            <p className="mt-2 rounded-md bg-surface-2 px-3 py-2 text-[12px] text-accent-300">
                                Для проверки прототипа введите код 0000
                            </p>
                        )}
                        <label htmlFor="account-code" className="mt-4 block text-[12px] text-text/65">
                            Код из SMS
                        </label>
                        <input
                            id="account-code"
                            autoFocus
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            value={code}
                            onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="0000"
                            className="mt-1.5 min-h-12 w-full rounded-md border border-divider bg-surface-2
                                px-3 text-center font-heading text-[22px] tracking-[0.35em] text-text
                                outline-none placeholder:text-text/25 focus:border-accent"
                        />
                        {message && (
                            <p className="mt-2 text-[12px] leading-relaxed text-[#f3a8a8]" role="alert">
                                {message}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={code.length !== 4 || pending}
                            className="btn-cta mt-4 disabled:is-disabled"
                        >
                            {pending ? 'Проверяем…' : 'Продолжить'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setMessage('');
                                setCode('');
                                setView('phone');
                            }}
                            className="mt-3 w-full py-2 text-[12.5px] text-text/55 hover:text-accent"
                        >
                            Изменить номер
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

function DocumentIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M7 3h7l4 4v14H7z" />
            <path d="M14 3v5h5M10 13h5M10 17h5" />
        </svg>
    );
}

function SheetHeader({
    view,
    onBack,
    onClose,
}: {
    view: View;
    onBack: () => void;
    onClose: () => void;
}) {
    const title = view === 'menu' ? 'Меню' : view === 'phone' ? 'Вход' : 'Введите код';

    return (
        <div className="mb-4 flex min-h-8 items-center gap-2">
            {view !== 'menu' && (
                <button
                    type="button"
                    onClick={onBack}
                    aria-label="Назад"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-divider
                        text-text/70 hover:border-accent hover:text-accent"
                >
                    ‹
                </button>
            )}
            <h2 id="account-sheet-title" className="flex-1 font-heading text-[22px] font-medium">
                {title}
            </h2>
            <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                className="px-2 text-xl text-text/55 hover:text-accent"
            >
                ×
            </button>
        </div>
    );
}
