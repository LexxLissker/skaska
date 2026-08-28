export type Product = {
  id: string;
  variantId?: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  price1000?: number;
  imageUrl?: string;
  badge?: string;
  available: boolean;
};

export type Category = {
  id: string;
  name: string;
  description: string;
  subcategories: string[];
};

export const categories: Category[] = [
  {
    id: "pelmeni",
    name: "Пельмени",
    description: "Пельмени ручной лепки из охлаждённого мяса. Замораживаем в день лепки — готовим 7 минут, без разморозки.",
    subcategories: ["Классика", "Птица", "Детские", "Рыба/Постное"],
  },
  {
    id: "vareniki",
    name: "Вареники",
    description: "Тонкое тесто и щедрая начинка. Для уютного завтрака, обеда или десерта.",
    subcategories: ["Сладкие", "Сытные", "Постные"],
  },
  {
    id: "manty",
    name: "Манты",
    description: "Сочные манты с тонким тестом и ароматной начинкой.",
    subcategories: ["Классика", "Птица", "Овощные"],
  },
  {
    id: "hinkali",
    name: "Хинкали",
    description: "Крупные хинкали с бульоном внутри — готовятся из замороженного состояния.",
    subcategories: ["Классика", "Сыр", "Птица"],
  },
  {
    id: "kotlety",
    name: "Котлеты",
    description: "Домашние котлеты без лишнего — для быстрого сытного ужина.",
    subcategories: ["Мясные", "Птица", "Овощные"],
  },
  {
    id: "golubtsy",
    name: "Голубцы",
    description: "Домашние голубцы с нежной начинкой и тонким капустным листом.",
    subcategories: ["Классика", "Постные"],
  },
  {
    id: "lapsha",
    name: "Лапша и соусы",
    description: "Лапша ручной работы и соусы, которые делают домашний ужин цельным.",
    subcategories: ["Лапша", "Соусы", "Масла"],
  },
];

export const products: Product[] = [
  { id: "pelmeni-beef", categoryId: "pelmeni", name: "Пельмени, Говядина/свинина", description: "Классические пельмени ручной лепки с насыщенной мясной начинкой.", price: 350, price1000: 650, badge: "Хит", available: true },
  { id: "pelmeni-chicken", categoryId: "pelmeni", name: "Пельмени, Курица и индейка", description: "Нежная птица и сочная начинка для лёгкого домашнего ужина.", price: 417, price1000: 780, available: true },
  { id: "pelmeni-veal", categoryId: "pelmeni", name: "Пельмени, Телятина", description: "Деликатная телятина и тонкое классическое тесто.", price: 484, price1000: 900, available: true },
  { id: "pelmeni-mushroom", categoryId: "pelmeni", name: "Пельмени, С грибами", description: "Ароматные грибы, сливочная нота и тонкое тесто.", price: 551, price1000: 1030, available: true },
  { id: "vareniki-curd", categoryId: "vareniki", name: "Вареники с творогом", description: "Нежный творог, немного ванили и тонкое тесто.", price: 380, price1000: 710, available: true },
  { id: "vareniki-potato", categoryId: "vareniki", name: "Вареники с картофелем", description: "Картофель, жареный лук и домашнее тесто.", price: 360, price1000: 680, available: true },
  { id: "manty-classic", categoryId: "manty", name: "Манты, классика", description: "Сочные манты с рубленым мясом и ароматными специями.", price: 490, price1000: 920, available: true },
  { id: "hinkali-classic", categoryId: "hinkali", name: "Хинкали, классика", description: "Большие хинкали с пряным мясным бульоном внутри.", price: 448, price1000: 840, available: true },
  { id: "sauce-sour", categoryId: "lapsha", name: "Сметанно-чесночный соус", description: "К пельменям, вареникам и запечённым блюдам.", price: 99, available: true },
  { id: "sauce-broth", categoryId: "lapsha", name: "Бульонный концентрат", description: "Для насыщенного домашнего бульона.", price: 89, available: true },
  { id: "butter-ghee", categoryId: "lapsha", name: "Топлёное масло с розмарином", description: "Ароматное масло для подачи горячих блюд.", price: 129, available: true },
];

export const doughOptions = ["Высший сорт", "Полбяное", "Цельнозерновое"];
export const fatOptions = ["Бульон", "Сливочное масло", "Оливковое масло"];
export const colorOptions = ["Обычное", "Зелёное", "Оранжевое", "Чёрное"];
export const textureOptions = ["Мелкий помол", "Рубленое ножом"];

export const bundles = [
  { id: "tasting", title: "Дегустация", text: "4 вкуса по 250 г — попробовать всё", price: 819, tag: "Набор" },
  { id: "evening", title: "Тёплый вечер", text: "На двоих: пельмени, масло и соус", price: 799, tag: "На двоих" },
  { id: "family", title: "Семейный запас", text: "6 упаковок для быстрых домашних ужинов", price: 2490, tag: "Семейный" },
];

export const reviews = [
  { name: "Ирина", rating: "4.9", text: "Пельмени как у бабушки — тесто тонкое, мяса много. Готовятся правда за 7 минут." },
  { name: "Дмитрий", rating: "4.8", text: "Пробовал классику с курицей — не разваливаются при варке, начинка сочная." },
];
