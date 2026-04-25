export function formatIsk(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B ISK`;
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M ISK`;
  }

  return `${Math.round(value).toLocaleString("en-US")} ISK`;
}

export function formatM3(value: number): string {
  return `${value.toLocaleString("en-US")} m3`;
}
