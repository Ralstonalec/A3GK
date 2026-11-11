/** Same style as the product pages (lib/currency.ts): Canadian dollars read "$50.00", other currencies carry their own prefix such as "US$". */
export const formatMoney = (amount: string | number, currency: string) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(Number(amount));
