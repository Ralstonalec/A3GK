export type Money = { amount: string; currencyCode: string };

export type Variant = {
  id: string;
  title: string;
  availableForSale: boolean;
  selectedOptions: { name: string; value: string }[];
  price: Money;
};

export type Product = {
  handle: string;
  title: string;
  descriptionHtml: string;
  options: { name: string; values: string[] }[];
  variants: Variant[];
  images: { url: string; altText: string | null }[];
  /** True when the data came from the Shopify Storefront API. False = unconnected placeholder. */
  connected: boolean;
};

export type CartLine = {
  id: string;
  quantity: number;
  merchandise: { id: string; title: string; product: { title: string; handle: string } };
  cost: { totalAmount: Money };
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: CartLine[];
  cost: { subtotalAmount: Money };
};
