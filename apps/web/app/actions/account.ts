'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { DEMO_ACCOUNT_COOKIE, isDemoAccount } from '@/lib/account';
import { isPhoneComplete } from '@/lib/format';

export type AccountActionResult =
    | { ok: true; demo: boolean }
    | { ok: false; message: string };

/**
 * Точка подключения SMS-провайдера. Пока он не выбран, production никогда
 * не подтверждает отправку кода и не создаёт ложную авторизацию.
 */
export async function requestPhoneCode(phoneDigits: string): Promise<AccountActionResult> {
    if (!isPhoneComplete(phoneDigits)) {
        return { ok: false, message: 'Введите номер телефона полностью.' };
    }

    if (isDemoAccount) return { ok: true, demo: true };

    return {
        ok: false,
        message: 'Вход по SMS пока не подключён. Мы сообщим, когда он станет доступен.',
    };
}

export async function confirmPhoneCode(
    phoneDigits: string,
    code: string,
): Promise<AccountActionResult> {
    if (!isPhoneComplete(phoneDigits)) {
        return { ok: false, message: 'Номер телефона указан неверно.' };
    }

    if (!isDemoAccount) {
        return { ok: false, message: 'Подтверждение по SMS пока не подключено.' };
    }

    if (code !== '0000') {
        return { ok: false, message: 'Неверный код. Для прототипа используйте 0000.' };
    }

    (await cookies()).set(DEMO_ACCOUNT_COOKIE, phoneDigits, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 12,
    });

    return { ok: true, demo: true };
}

export async function signOutAccount() {
    (await cookies()).delete(DEMO_ACCOUNT_COOKIE);
    redirect('/');
}

