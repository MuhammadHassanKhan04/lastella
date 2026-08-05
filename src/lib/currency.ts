export const CURRENCY = "SAR";
export const CURRENCY_SYMBOL = "SAR";

const fmt = new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 });

export function formatPrice(amount: number): string {
  return `${CURRENCY_SYMBOL} ${fmt.format(amount)}`;
}
