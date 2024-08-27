export function formatDisplay(value: number, decimals: number): string {
  const num = value / Math.pow(10, decimals);
  return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
}
