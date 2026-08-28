import type { Product } from "./storefront-data";

export type ProductOptions = {
  dough?: string;
  fat?: string;
  doughColor?: string;
  meatTexture?: string;
};

export type CartItemState = Product & {
  lineId?: string;
  quantity: number;
  weight: 500 | 1000;
  options: string[];
};

const endpoint = process.env.NEXT_PUBLIC_VENDURE_API_URL;
const customOptionsEnabled = process.env.NEXT_PUBLIC_VENDURE_CUSTOM_OPTIONS === "true";

export const vendureEnabled = Boolean(endpoint);

type ApiOrder = {
  lines: Array<{
    id: string;
    quantity: number;
    unitPriceWithTax: number;
    productVariant: {
      id: string;
      name: string;
      product: {
        id: string;
        name: string;
        description?: string;
        featuredAsset?: { preview?: string | null } | null;
        collections?: Array<{ slug: string }>;
      };
    };
    customFields?: ProductOptions;
  }>;
};

async function request<T>(query: string, variables?: Record<string, unknown>): Promise<T | null> {
  if (!endpoint) return null;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    const payload = await response.json();
    if (!response.ok || payload.errors) throw new Error("Vendure Shop API request failed");
    return payload.data as T;
  } catch {
    // A local UI fallback is preferable to a broken basket during API setup.
    return null;
  }
}

function optionList(customFields?: ProductOptions): string[] {
  return [customFields?.dough, customFields?.fat, customFields?.doughColor, customFields?.meatTexture].filter((value): value is string => Boolean(value));
}

function weightFor(variantName: string): 500 | 1000 {
  return /(^|\s)(1\s?(кг|kg)|1000\s?г)(\s|$)/i.test(variantName) ? 1000 : 500;
}

function mapOrder(order?: ApiOrder | null): CartItemState[] {
  if (!order) return [];
  return order.lines.map((line) => ({
    id: line.productVariant.product.id,
    variantId: line.productVariant.id,
    lineId: line.id,
    categoryId: line.productVariant.product.collections?.[0]?.slug || "pelmeni",
    name: line.productVariant.product.name,
    description: line.productVariant.product.description || "",
    price: line.unitPriceWithTax,
    imageUrl: line.productVariant.product.featuredAsset?.preview || undefined,
    available: true,
    quantity: line.quantity,
    weight: weightFor(line.productVariant.name),
    options: optionList(line.customFields),
  }));
}

const customFieldSelection = customOptionsEnabled ? "customFields { dough fat doughColor meatTexture }" : "";
const orderLinesSelection = `lines {
  id quantity unitPriceWithTax
  ${customFieldSelection}
  productVariant {
    id name
    product {
      id name description
      featuredAsset { preview }
      collections { slug }
    }
  }
}`;

const activeOrderQuery = `query ActiveOrder {
  activeOrder {
    ${orderLinesSelection}
  }
}`;

export async function getActiveCart(): Promise<CartItemState[] | null> {
  const data = await request<{ activeOrder: ApiOrder | null }>(activeOrderQuery);
  return data ? mapOrder(data.activeOrder) : null;
}

export async function addVendureItem(product: Product, quantity: number, options: ProductOptions = {}): Promise<CartItemState[] | null> {
  if (!product.variantId) return null;
  const input = customOptionsEnabled
    ? "customFields: $customFields"
    : "";
  const query = `mutation AddItem($variantId: ID!, $quantity: Int!${customOptionsEnabled ? ", $customFields: OrderLineCustomFieldsInput" : ""}) {
    addItemToOrder(productVariantId: $variantId, quantity: $quantity${input ? `, ${input}` : ""}) {
      ... on Order { ${orderLinesSelection} }
      ... on ErrorResult { errorCode message }
    }
  }`;
  const variables: Record<string, unknown> = { variantId: product.variantId, quantity };
  if (customOptionsEnabled) variables.customFields = options;
  const data = await request<{ addItemToOrder: ApiOrder }>(query, variables);
  return data ? mapOrder(data.addItemToOrder) : null;
}

export async function adjustVendureItem(lineId: string, quantity: number): Promise<CartItemState[] | null> {
  const data = await request<{ adjustOrderLine: ApiOrder }>(`mutation AdjustOrderLine($lineId: ID!, $quantity: Int!) {
    adjustOrderLine(orderLineId: $lineId, quantity: $quantity) {
      ... on Order { ${orderLinesSelection} }
      ... on ErrorResult { errorCode message }
    }
  }`, { lineId, quantity });
  return data ? mapOrder(data.adjustOrderLine) : null;
}
