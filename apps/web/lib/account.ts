import { cookies } from 'next/headers';

import { formatPhone, isPhoneComplete } from './format';

export const DEMO_ACCOUNT_COOKIE = 'zamorozka_demo_customer';

export interface AccountSession {
    phoneDigits: string;
    phoneDisplay: string;
}

export const isDemoAccount = process.env.NEXT_PUBLIC_USE_VENDURE !== 'true';

/**
 * Демо-сессия существует только в локальной витрине. В production личный
 * кабинет должен опираться на подтверждённую сессию покупателя Vendure.
 */
export async function getAccountSession(): Promise<AccountSession | null> {
    if (!isDemoAccount) return null;

    const phoneDigits = (await cookies()).get(DEMO_ACCOUNT_COOKIE)?.value ?? '';
    if (!isPhoneComplete(phoneDigits)) return null;

    return {
        phoneDigits,
        phoneDisplay: formatPhone(phoneDigits).display,
    };
}

