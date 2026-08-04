import { redirect } from 'next/navigation';

import { CheckoutView } from '@/components/checkout/checkout-view';
import { getCart } from '@/lib/api/cart';

export const metadata = { title: 'Оформление — Заморозка' };

export default async function CheckoutPage() {
    const cart = await getCart();

    // Оформлять нечего — возвращаем в корзину, а не показываем пустую форму.
    if (!cart || cart.lines.length === 0) redirect('/cart');

    return <CheckoutView initialCart={cart} />;
}
