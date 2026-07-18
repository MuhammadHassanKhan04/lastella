export const CURRENCY = "PKR";
export const CURRENCY_SYMBOL = "Rs.";

const fmt = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });

export function formatPrice(amount: number): string {
  return `${CURRENCY_SYMBOL} ${fmt.format(Math.round(amount))}`;
}
