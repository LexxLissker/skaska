"use client";

import { useEffect, useMemo, useState } from "react";
import { bundles, colorOptions, doughOptions, fatOptions, reviews, textureOptions, type Product } from "@/lib/storefront-data";
import type { StorefrontCatalog } from "@/lib/vendure";
import { addVendureItem, adjustVendureItem, getActiveCart, vendureEnabled, type CartItemState, type ProductOptions } from "@/lib/vendure-client";

type CartItem = CartItemState;
type Screen = "catalog" | "detail" | "cart" | "checkout" | "search" | "menu";
const money = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 });

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "back") return <svg {...props}><path d="m15 18-6-6 6-6" /></svg>;
  if (name === "search") return <svg {...props}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>;
  if (name === "cart") return <svg {...props}><path d="M7 8h10l-1 11H8L7 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg>;
  if (name === "chat") return <svg {...props}><path d="M20 15a4 4 0 0 1-4 4H9l-4 3v-7a4 4 0 0 1-1-3V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v7Z" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></svg>;
  if (name === "menu") return <svg {...props}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
  if (name === "plus") return <svg {...props}><path d="M12 5v14M5 12h14" /></svg>;
  if (name === "minus") return <svg {...props}><path d="M5 12h14" /></svg>;
  if (name === "chevron") return <svg {...props}><path d="m9 18 6-6-6-6" /></svg>;
  if (name === "pin") return <svg {...props}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17" /><circle cx="12" cy="12" r="3" /></svg>;
}

function ImageSlot({ product, className = "" }: { product?: Product; className?: string }) {
  return <div className={"image-slot " + className}>{product?.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <><span className="steam s1" /><span className="steam s2" /><span className="steam s3" /><div className="image-slot__dish">✦</div><div className="image-slot__empty">Фото товара</div></>}</div>;
}

function Choice({ title, note, values, selected, change }: { title: string; note: string; values: string[]; selected: string; change: (value: string) => void }) {
  return <section className="choice-group"><h3>{title}</h3><div className="chips">{values.map((value) => <button key={value} onClick={() => change(value)} className={"chip " + (selected === value ? "is-active" : "")}>{value}</button>)}</div><p>{note}</p></section>;
}

export function Storefront({ catalog }: { catalog: StorefrontCatalog }) {
  const [screen, setScreen] = useState<Screen>("catalog");
  const [activeCategory, setActiveCategory] = useState(catalog.categories[0]?.id || "pelmeni");
  const [activeSubcategory, setActiveSubcategory] = useState(0);
  const [selected, setSelected] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [weight, setWeight] = useState<500 | 1000>(500);
  const [quantity, setQuantity] = useState(1);
  const [dough, setDough] = useState(doughOptions[0]);
  const [fat, setFat] = useState(fatOptions[0]);
  const [color, setColor] = useState(colorOptions[0]);
  const [texture, setTexture] = useState(textureOptions[0]);
  const [search, setSearch] = useState("");
  const [address, setAddress] = useState("");
  const [delivery, setDelivery] = useState("Ближайшая: сб, 30 августа · 12:00–15:00");
  const [payment, setPayment] = useState("sbp");
  const [phone, setPhone] = useState("");
  const [cartLoading, setCartLoading] = useState(vendureEnabled);
  const active = catalog.categories.find((item) => item.id === activeCategory) || catalog.categories[0];
  const productList = useMemo(() => catalog.products.filter((item) => item.categoryId === activeCategory), [activeCategory, catalog.products]);
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  const linePrice = (item: CartItem) => (item.weight === 1000 ? item.price1000 || item.price * 2 : item.price) * item.quantity;
  const total = cart.reduce((sum, item) => sum + linePrice(item), 0);
  const options = [dough, fat, color, texture];
  const openProduct = (item: Product) => { setSelected(item); setWeight(500); setQuantity(1); setScreen("detail"); };
  useEffect(() => {
    if (!vendureEnabled) return;
    void getActiveCart().then((items) => {
      if (items) setCart(items);
      setCartLoading(false);
    });
  }, []);

  const add = async (item: Product, itemWeight: 500 | 1000 = 500, qty = 1, itemOptions: string[] = []) => {
    const customOptions: ProductOptions = itemOptions.length === 4
      ? { dough: itemOptions[0], fat: itemOptions[1], doughColor: itemOptions[2], meatTexture: itemOptions[3] }
      : {};
    if (vendureEnabled && item.variantId) {
      const remoteCart = await addVendureItem(item, qty, customOptions);
      if (remoteCart) {
        setCart(remoteCart);
        return;
      }
    }
    const identity = item.id + "-" + itemWeight + "-" + itemOptions.join("-");
    setCart((items) => {
      const found = items.find((cartItem) => cartItem.id + "-" + cartItem.weight + "-" + cartItem.options.join("-") === identity);
      return found ? items.map((cartItem) => cartItem === found ? { ...cartItem, quantity: cartItem.quantity + qty } : cartItem) : [...items, { ...item, weight: itemWeight, quantity: qty, options: itemOptions }];
    });
  };
  const alter = async (index: number, delta: number) => {
    const item = cart[index];
    if (vendureEnabled && item?.lineId) {
      const remoteCart = await adjustVendureItem(item.lineId, item.quantity + delta);
      if (remoteCart) {
        setCart(remoteCart);
        return;
      }
    }
    setCart((items) => items.flatMap((cartItem, itemIndex) => itemIndex !== index ? [cartItem] : cartItem.quantity + delta > 0 ? [{ ...cartItem, quantity: cartItem.quantity + delta }] : []));
  };
  const back = () => setScreen(screen === "checkout" ? "cart" : "catalog");

  return <main className="app-shell"><div className="phone-frame">
    {screen !== "catalog" && <header className="screen-header"><button className="round-button" onClick={back}><Icon name="back" /></button><h1>{screen === "detail" ? selected?.name : screen === "cart" ? "Корзина" : screen === "checkout" ? "Оформление" : screen === "search" ? "Поиск" : "Меню"}</h1></header>}

    {screen === "catalog" && <div className="scroll-area catalog-screen">
      <section className="catalog-hero"><div className="hero-noise" /><Icon name="logo" size={40} /><h1>{active?.name}</h1><p>{active?.description}</p></section>
      <nav className="category-tabs">{catalog.categories.slice(0, 4).map((item) => <button key={item.id} onClick={() => { setActiveCategory(item.id); setActiveSubcategory(0); }} className={item.id === activeCategory ? "is-active" : ""}>{item.name}</button>)}</nav>
      <nav className="subcategory-tabs">{active?.subcategories.map((item, index) => <button key={item} onClick={() => setActiveSubcategory(index)} className={index === activeSubcategory ? "is-active" : ""}>{item}</button>)}</nav>
      <section className="category-story"><ImageSlot product={productList[0]} className="story-image" /><div><h2>{active?.name}, {active?.subcategories[activeSubcategory] || "Классика"}</h2><p>{active?.description}</p></div></section>
      <section className="product-grid">{productList.map((item) => <article className="product-card" key={item.id}><button className="card-open" onClick={() => openProduct(item)} aria-label={"Открыть " + item.name}><ImageSlot product={item} className="product-image" /></button><div className="product-card__body"><button className="product-name" onClick={() => openProduct(item)}>{item.name}</button><div className="card-buy"><div className="weight-pills"><button className="is-active">0.5 <small>кг</small></button>{item.price1000 && <button>1 <small>кг</small></button>}</div><button className="price-add" onClick={() => add(item)}><Icon name="plus" size={15} />{money.format(item.price)}</button></div></div></article>)}</section>
      <button className="more-button">Показать ещё</button>
      <section className="section-block"><h2>Наборы для дома</h2><div className="horizontal-list">{bundles.map((bundle) => <article className="bundle-card" key={bundle.id}><span className="tag">{bundle.tag}</span><h3>{bundle.title}</h3><p>{bundle.text}</p><strong>{money.format(bundle.price)}</strong><button onClick={() => { if (productList[0]) add(productList[0], 1000, 1, [bundle.title]); }}>Добавить набор</button></article>)}</div></section>
      <section className="section-block"><h2>Отзывы</h2><div className="horizontal-list">{reviews.map((review) => <article className="review-card" key={review.name}><div><span className="review-avatar">{review.name[0]}</span><b>{review.name}</b><small>★ {review.rating}</small></div><p>{review.text}</p></article>)}</div></section>
      <section className="section-block benefit-section"><h2>Почему выбирают нас</h2><article className="benefit-card"><span className="tag">Набор-дегустация</span><h3>4 вкуса по 250 г — попробовать всё</h3><p>Пельмени, сытные вареники, постные вареники и хинкали в одной пачке.</p><button>Собрать набор</button></article><h2>Как мы готовим</h2><div className="horizontal-list"><article className="process-card"><b>01</b><h3>Продукты</h3><p>Отбираем свежее мясо, овощи и муку у проверенных поставщиков.</p></article><article className="process-card"><b>02</b><h3>Лепка</h3><p>Лепим небольшими партиями и замораживаем в день производства.</p></article></div></section>
    </div>}

    {screen === "detail" && selected && <div className="scroll-area detail-screen"><ImageSlot product={selected} className="detail-image" /><section className="detail-body"><h1>{selected.name}</h1><p className="nutrition">Б/Ж/У на 100 г: 11 / 9 / 24 г · 222 ккал</p><div className="detail-buy"><div className="weight-pills"><button onClick={() => setWeight(500)} className={weight === 500 ? "is-active" : ""}>500 г</button><button onClick={() => setWeight(1000)} className={weight === 1000 ? "is-active" : ""}>1000 г</button></div><div className="quantity-control"><button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Icon name="minus" size={14} /></button><span>{quantity}</span><button onClick={() => setQuantity(quantity + 1)}><Icon name="plus" size={14} /></button></div></div><Choice title="Тесто" note="Классическое тесто на пшеничной муке высшего сорта." values={doughOptions} selected={dough} change={setDough} /><Choice title="Сочность и жир" note="Насыщенный мясной сок и классический домашний аромат." values={fatOptions} selected={fat} change={setFat} /><Choice title="Цвет теста" note="Натуральный цвет теста без добавок." values={colorOptions} selected={color} change={setColor} /><Choice title="Текстура мяса" note="Классический мягкий и привычный фарш." values={textureOptions} selected={texture} change={setTexture} /><section className="addons"><h3>С чем подать?</h3><div className="horizontal-list">{catalog.products.filter((item) => item.categoryId === "lapsha").slice(0, 3).map((item) => <article key={item.id}><b>{item.name}</b><span>{money.format(item.price)}</span><button onClick={() => add(item)}><Icon name="plus" size={14} /></button></article>)}</div></section></section><footer className="detail-cta"><button onClick={() => { add(selected, weight, quantity, options); setScreen("cart"); }}><Icon name="cart" />Добавить в корзину — {money.format((weight === 1000 ? selected.price1000 || selected.price * 2 : selected.price) * quantity)}</button></footer></div>}

    {screen === "cart" && <div className="scroll-area cart-screen"><section className="order-card cart-order-card"><h2>{totalQty || 0} {totalQty === 1 ? "товар" : "товаров"}</h2>{cartLoading ? <div className="empty-cart"><p>Загружаем корзину…</p></div> : cart.length === 0 ? <div className="empty-cart"><Icon name="cart" size={32} /><p>В корзине пока пусто</p><button onClick={() => setScreen("catalog")}>Перейти в каталог</button></div> : cart.map((item, index) => <article className="cart-line" key={item.lineId || item.id + index}><ImageSlot product={item} className="cart-image" /><div className="cart-line__body"><div className="cart-line__top"><div><b>{item.name}</b><small>{item.options[0] || "Стандарт"}</small><em>{item.weight === 1000 ? "1 кг" : "0.5 кг"}</em></div><strong>{money.format(linePrice(item))}</strong></div><div className="cart-quantity"><button aria-label="Уменьшить количество" onClick={() => void alter(index, -1)}><Icon name="minus" size={13} /></button><span>{item.quantity}</span><button aria-label="Увеличить количество" onClick={() => void alter(index, 1)}><Icon name="plus" size={13} /></button></div></div></article>)}</section><div className="sticky-action"><button disabled={!cart.length || cartLoading} onClick={() => setScreen("checkout")}>Оформить заказ · {money.format(total)}</button></div></div>}

    {screen === "checkout" && <div className="scroll-area checkout-screen"><section className="checkout-card"><h2>Доставка</h2><label>Улица и дом<input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Начните вводить адрес" /></label>{address && <div className="delivery-result"><Icon name="pin" size={18} /><div><b>Доставим в вашу зону</b><span>Стоимость и слот уточнены</span></div></div>}<h3>Когда доставить</h3><div className="delivery-options">{["Ближайшая: сб, 30 августа · 12:00–15:00", "Вс, 31 августа · 18:00–21:00"].map((item) => <button key={item} onClick={() => setDelivery(item)} className={delivery === item ? "is-active" : ""}>{item}</button>)}</div></section><section className="checkout-card"><h2>Оплата</h2><label className={"payment-option " + (payment === "sbp" ? "is-active" : "")}><input type="radio" checked={payment === "sbp"} onChange={() => setPayment("sbp")} /><span className="radio-dot" /><b>СБП</b><small>Оплата в банковском приложении</small></label><label className={"payment-option " + (payment === "card" ? "is-active" : "")}><input type="radio" checked={payment === "card"} onChange={() => setPayment("card")} /><span className="radio-dot" /><b>Банковская карта</b></label></section><section className="checkout-card"><h2>Контакты</h2><label>Телефон<input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+7 (___) ___-__-__" inputMode="tel" /></label><p className="muted">Пришлём статус заказа</p></section><section className="checkout-summary"><button onClick={() => setScreen("cart")}>Состав заказа · {totalQty} <Icon name="chevron" size={16} /></button><div><span>К оплате</span><b>{money.format(total)}</b></div></section><p className="legal">Нажимая «Оплатить», вы соглашаетесь с условиями оферты и политикой конфиденциальности.</p><div className="sticky-action"><button disabled={!address || !phone} onClick={() => alert("Здесь будет переход в СБП или платёжный провайдер Vendure.")}>Оплатить {money.format(total)}</button></div></div>}

    {screen === "search" && <div className="scroll-area search-screen"><label className="search-box"><Icon name="search" /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Пельмени, соусы, наборы…" /></label><section className="search-results">{catalog.products.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())).map((item) => <button key={item.id} onClick={() => openProduct(item)}><ImageSlot product={item} /><span>{item.name}<small>{money.format(item.price)}</small></span><Icon name="chevron" /></button>)}</section></div>}

    {screen === "menu" && <div className="scroll-area menu-screen"><section className="menu-profile"><div className="profile-circle"><Icon name="logo" /></div><h2>Для дома, как для своих</h2><p>Войдите, чтобы видеть историю заказов.</p><button>Войти по номеру</button></section><nav className="menu-list">{[["Доставка и самовывоз", "pin"], ["Связаться с нами", "chat"], ["О нас и как готовим", "logo"]].map(([label, icon]) => <button key={label}><Icon name={icon} /><span>{label}</span><Icon name="chevron" /></button>)}</nav><section className="menu-docs"><a href="#">Политика конфиденциальности</a><a href="#">Условия оферты</a><a href="#">Настройки cookies</a></section></div>}

    <nav className="bottom-nav"><button className="brand-button" onClick={() => setScreen("catalog")}><Icon name="logo" /></button><button onClick={() => setScreen("search")} className={screen === "search" ? "is-current" : ""}><Icon name="search" /></button><button onClick={() => setScreen("cart")} className={screen === "cart" ? "is-current" : ""}><Icon name="cart" />{totalQty > 0 && <i>{totalQty}</i>}</button><button aria-label="Написать в поддержку"><Icon name="chat" /></button><button onClick={() => setScreen("menu")} className={screen === "menu" ? "is-current" : ""}><Icon name="menu" /></button></nav>
  </div></main>;
}
