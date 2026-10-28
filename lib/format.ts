export const formatMoney = (amount: string | number, currency: string) =>
  new Intl.NumberFormat('en', { style: 'currency', currency }).format(Number(amount));
