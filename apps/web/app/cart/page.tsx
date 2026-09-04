import { CartView } from '@/components/cart/cart-view';
import { getCart } from '@/lib/api/cart';

export const metadata = {
    title: 'Корзина',
    description: 'Состав заказа в магазине «Скаска»: выбранные блюда, вес, количество и итоговая стоимость.',
    robots: { index: false, follow: false },
};

export default async function CartPage() {
    const cart = await getCart();
    return <CartView cart={cart} />;
}
