/** Money helpers. Everything internal is paise; only the edges see rupees. */

export function formatINR(paise: number): string {
  const rupees = paise / 100;
  const hasPaise = paise % 100 !== 0;
  return `Rs. ${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function rupeesToPaise(rupees: number | string): number {
  return Math.round(Number(rupees) * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function discountPercent(price: number, compareAt: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
