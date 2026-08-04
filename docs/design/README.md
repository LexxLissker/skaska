# Handoff: «Заморозка» — Frozen Food PWA

## Overview
A premium PWA storefront for a small frozen-food (pelmeni/vareniki/hinkali-style) delivery business: browse catalog → customize a product → cart → checkout (scheduled zone-based delivery → contacts → payment) → pay. Dark, restrained, gold-accented visual system. Single-owner/small-operation scale — deliberately not a "Yandex Lavka"-style on-demand marketplace.

## About the Design Files
The files in this bundle are **design references built as an HTML/React prototype** — they show intended look, content, states and interactions. They are **not production code to copy directly**. The task is to **recreate this design in Vendure + your chosen storefront framework** (e.g. Next.js), using Vendure's own extension points (see "Backend Architecture Notes" below) and your codebase's own conventions — not to port this file's markup as-is.

Everything here is **frontend-only simulation**: there is no real backend, database, auth, payment, or geocoding behind it. Cart/checkout math, the delivery-zone lookup, the phone/SMS login, and the payment overlays are all mocked client-side with in-memory JS. All product photography is an empty drag-and-drop placeholder (`<image-slot>`), not real imagery.

## Fidelity
**Hi-fi** for visual design: colors, type, spacing, radii, shadows, states, and copy are final/intentional — recreate pixel-close. **Lo-fi / placeholder** for: product photography (empty slots), legal document content (oferta/policy links go nowhere — real legal text needed), and all backend logic (delivery, payment, auth are illustrative flows only, not integrations).

## Screens / Views

### 1. Main / Catalog
- Hero: full-bleed category image (`image-slot`), bottom gradient fade to background, category name + description overlaid.
- Category chips (horizontal scroll): active chip gets accent border + soft glow (`box-shadow: 0 0 12px rgba(229,184,75,.18)`), inactive is outline `--color-divider`.
- Subcategory tabs (underline style) below chips; subcategory image banner (414px) with heading + description.
- Product grid: cards with 1:1 image, name, half-kg/1-kg weight toggle, price. Starts with **6 visible**, "Показать ещё" reveals **+2** at a time.
- Sticky docked category bar fades in after scrolling ~790px past the catalog, fades out once catalog scrolls out of view (translateY + opacity transition, .32s/.28s).
- "Наборы для дома" — horizontal scroll of 3 bundle cards (image, tag, title, meta, description, price button). Adds to cart with a **fly-to-cart animation** (small dot flies from the card to the cart icon along a computed dx/dy, .56s cubic-bezier, then cart icon bumps).
- "Отзывы" — horizontal review cards (avatar initial, name, rating, quote).
- "Почему выбирают нас" — horizontal gradient-tinted offer cards (tag, title, description, optional CTA).
- "Как мы готовим" — horizontal numbered step cards (icon, big faint step number, title, description).
- "Вопросы и ответы" — accordion list, +/− indicator.

### 2. Product detail
- Full-width 4:3 hero image, back button (circular, translucent), product name overlaid at bottom.
- Row: weight toggle (0.5/1 kg) + qty stepper (− / count / +) + primary "+ price ₽" add-to-cart button.
- Б/Ж/У + kcal per 100g line.
- Four option groups, each a horizontal pill row + one-line hint text below: **Тесто** (dough), **Сочность и жир** (fat), **Цвет теста** (color/dye), **Текстура мяса** (mince texture). Active pill = accent border + glow, same treatment as category chips.
- "С чем подать?" — optional relevant add-on cards (name, price in `#E5B84B` gold with soft text-shadow, small circular + quick-add button) — only shown if relevant add-ons exist for the category.
- Description + Состав (computed ingredient list from the selected dough/fat/color/texture picks).
- Upsell bottom sheet ("Шеф рекомендует") can appear after certain adds: skip or add-for-price.

### 3. Cart ("Корзина")
- Line items: 64×64 image, name, variant/meta, qty stepper (**muted "−"**, **accent "+"**), price.
- Promo code: input + "Применить" until a code is applied, then shows code (gold, bold) + discount + a muted **"×" remove** control. Unknown code shows "Промокод не найден".
- Totals card: Товары / (Скидка, if promo) / Итого (bold, gold, larger).
- Sticky footer CTA: "Оформить заказ · {sum}" — disabled/dimmed when cart is empty.

### 4. Checkout ("Оформление")
Order top-to-bottom: **Доставка → Контакты → Оплата → Товары (recap)**.
- **Доставка**: address field with autocomplete suggestions (dropdown list, mousedown-select). Once selected: a zone/run summary card — "Зона «X» · ближайший рейс", bold next-run date+window, delivery cost row (or "Бесплатно" in gold once the zone's free-delivery subtotal threshold is hit), "До бесплатной доставки осталось N ₽" (or "активна"), small deadline line ("Оформите заказ до {день}, {чч}:00"). Segmented control **"Ближайший рейс / Другая дата"** — the latter reveals up to 4 upcoming run-date pills. Before an address is chosen: a muted placeholder card.
- **Контакты**: phone field, `+7 (___) ___-__-__` mask enforced live.
- **Оплата**: radio rows — **СБП** (default) and **Банковская карта**, active row gets accent border + tinted fill.
- **Товары**: collapsible recap (chevron rotates open), then Товары / Промокод (if any) / Доставка / **К оплате** (bold, gold, largest).
- Sticky footer: "Оплатить {total}", disabled when cart empty.
- Tapping Оплатить opens a bottom-sheet overlay per method: **СБП** → "Переходим в банковское приложение" + amount + Отмена; **Карта** → number/expiry/CVC fields + Оплатить/Отмена. Both are pure UI mocks (no real gateway call).

### 5. Account & legal menu (bottom-nav hamburger)
Bottom sheet, opened from the ☰ icon in the persistent bottom nav (same nav also holds a brand badge, search toggle, cart icon with count bubble, and a contact popover with Telegram/MAX/WhatsApp/phone/email links).
- Title row + × close.
- **"Мои заказы"** card: if logged out, phone input (+7 mask) → "Код" button (disabled until 11 digits) → reveals 4-digit SMS-code input → "Войти". Once "logged in", shows an empty state ("Заказов пока нет — оформите первый в корзине"). Pure client-side mock, no real OTP.
- **"Документы"**: 4 link rows (Публичная оферта · Политика конфиденциальности · Согласие на обработку персональных данных · Условия доставки и возврата) — each currently a dead link (`href="#"`, `preventDefault`), needs real legal pages. Below them, a visually demoted (smaller, muted) **"Настройки cookie"** row that expands to one toggle ("Аналитические cookie"). No first-visit consent banner is built yet — only the in-menu settings control exists.

## Interactions & Behavior
- Fly-to-cart: computed start/end coordinates (origin element → cart icon) via `getBoundingClientRect`, animated custom-property-driven CSS keyframes, auto-cleans up after 560ms, then triggers a spring "bump" on the cart icon.
- Category/subcategory switching resets `visibleCount` to 6.
- Search and contact popovers are mutually exclusive (opening one closes the other); the account menu is independent of both.
- All phone inputs (checkout contact + menu login) share the same live `+7 (___) ___-__-__` formatting logic.
- Delivery zone is resolved from the exact selected address string (a fixed lookup table in this prototype) → drives cost, free-delivery threshold, and the list of upcoming scheduled runs (computed from real calendar dates, filtered by each zone's order deadline).
- Disabled-state convention throughout: 45% opacity + no pointer, e.g. empty-cart pay button, incomplete-phone "Код" button, sub-4-digit "Войти".

## State Management (current prototype, per-session in-memory only)
Screen routing: `screen` (`main` / `product` / `cart` / `checkout`) + `previousScreen`. Catalog: `activeCat`, `activeSub`, `visibleCount`, `cardWeights` (per-card half/kg pick). Product detail: `selectedId`, `qty`, `selectedWeight/Dough/Fat/Color/Texture`, `upsellOpen/upsellAddon`. Cart: `cart[]` (id, name, variant, meta, unitPrice, qty, imgId, desc), `promoInput/promoApplied/promoError`, `flyingItems[]`, `cartBump`. Checkout: `checkoutAddress`, `addressSelected/addressFocused`, `deliveryTimeMode` (`nearest`/`choose`), `selectedRunIndex`, `phone`, `paymentMethod` (`sbp`/`card`), `orderExpanded`, `payOverlay` (`null`/`sbp`/`card`), `cardNumber/cardExpiry/cardCvc`. Menu: `menuOpen`, `menuPhone/menuCode/menuCodeSent/menuLoggedIn`, `menuCookieOpen/cookieAnalytics`. Chrome: `searchOpen`, `contactOpen`, `docked` (sticky category bar).

## Design Tokens
- Ground: `--color-bg` (near-black), `--color-surface` / `--color-surface-2` (card fills), `--color-divider` (hairlines), `--color-text`.
- Accent: gold — `var(--color-accent)` paired with a hardcoded `#C59B27` for the CTA gradient (`linear-gradient(135deg, var(--color-accent) 0%, #C59B27 100%)`), `--color-accent-300` for accent text on dark fills (AA-safer than the raw accent), raw gold `rgba(229,184,75,*)` used directly for card borders (`0.25` alpha) and glows (`0.18–0.2` alpha). Muted text throughout is `color-mix(in srgb, var(--color-text) NN%, transparent)` at 45/50/55/60/65/70% for hierarchy (not separate color tokens).
- Type: `--font-heading` for prices/totals/section numerals, `--font-body` elsewhere. Section headings 22px/500. Card titles 14.5–15px/500. Body/meta 12–13.5px.
- Shape: cards `border-radius:16px`, inputs/buttons `var(--radius-md)`, pills `999px`. Card shadow `0 8px 24px rgba(0,0,0,0.4)` + the gold hairline border above.
- Bottom nav: 64px, `rgba(17,24,39,.85)` + `backdrop-filter: blur(12px)`.

## Backend Architecture Notes (Vendure)
Agreed direction from design discussion — pass this to whoever implements the storefront/backend:
- **Not** on-demand routing (à la Yandex Lavka). **Scheduled zone-based delivery**: address → `DeliveryZone` → nearest `DeliveryRun` (concrete dated/windowed trip) generated from a `DeliveryScheduleTemplate` (weekday(s), window, order deadline, capacity). Zones carry their own cost + free-delivery threshold.
- Implement as a Vendure plugin (e.g. `ScheduledDeliveryPlugin`) using the built-in `ShippingEligibilityChecker` / `ShippingCalculator` extension points — don't compute shipping in the storefront.
- Suggested `Order` custom fields: `deliveryZoneId`, `deliveryRunId`, `deliveryDate`, `deliveryWindow`, `addressLat`, `addressLng`, `deliveryComment`.
- Storefront needs one extra query, e.g. `getDeliveryOptions(address, cart)` → available runs + cost + deadline.
- **Before payment**, re-validate server-side: address still in zone, run not full, deadline not passed, cart total matches tariff. **Hold the run slot ~15 min** on checkout start (release via a background job on expiry/failed payment) to prevent overselling the last spot.
- Address zone lookup: DaData (or Yandex Geocoder, given SBP/Kassa are already Yandex-adjacent) for normalization; a simple street/district lookup table is enough at this scale — defer polygon geometry (`turf`/PostGIS) until zone count or precision needs grow.
- Payment: SBP as default method, card as fallback — integrate Yandex Kassa or an SBP-specific SDK; the current "Переходим в банковское приложение" / card-form sheets are placeholders for that real redirect/iframe.
- Auth: phone-number + SMS code (no email/password) — matches the login pattern already built into the account menu; reuse the same phone number for order identity and (where applicable) SBP payer identity.

## Known inconsistencies to fix during implementation
- The homepage FAQ answer to "Как быстро приходит заказ?" and the "Почему выбирают нас" offer card ("Бесплатно от 3 000 ₽ ... привозим за 1–2 часа") still describe **fast/ASAP delivery** — this predates the scheduled zone-based delivery model above and needs rewriting to match (variable per-zone free threshold, no "1–2 hours" promise).
- Legal document links and the cookie-consent first-visit banner are not built — only the menu's document list and cookie-settings toggle exist.

## Assets
Images are `<image-slot>` drag-and-drop placeholders — some have a demo photo dropped in already (hero, product detail), others are still empty (cart line items, and likely others not pictured). Treat all of it as placeholder/reference, not final: source real product/lifestyle photography (ideally shot on a dark background, per this project's visual system) for every slot before shipping.

## Screenshots
See `screenshots/` — captured from the live prototype:
1. `01-main-catalog.png` — hero, category chips, product grid
2. `02-product-detail.png` — weight/qty/add row, Б/Ж/У, option pills
3. `03-cart.png` — line items, stepper
4. `04-checkout-delivery.png` — Доставка before an address is chosen
5. `05-checkout-autocomplete.png` — address suggestions open
6. `06-checkout-zone-selected.png` — resolved zone/run card (the delivery model above, in UI)
7. `07-account-menu.png` — the account/legal bottom sheet

## Files
- `Заморозка PWA.dc.html` — the full prototype (all screens, logic, and copy live in this one file).
- `support.js`, `image-slot.js`, `_ds/` — runtime dependencies the prototype needs to actually render if opened in a browser; not relevant to the Vendure/production implementation itself.
