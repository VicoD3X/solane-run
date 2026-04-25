import type { CargoSize, QuoteInput, QuoteResult, RouteResult } from "../types";

export const COLLATERAL_VALUE = 5_000_000_000;

export const cargoSizes: { label: string; value: CargoSize; volume: number }[] = [
  { label: "13,000 m3", value: "small", volume: 13_000 },
  { label: "60,000 m3", value: "medium", volume: 60_000 },
  { label: "800,000 m3", value: "freighter", volume: 800_000 },
];

export function volumeForSize(size: CargoSize) {
  return cargoSizes.find((option) => option.value === size)?.volume ?? cargoSizes[0].volume;
}

export function labelForSize(size: CargoSize) {
  return cargoSizes.find((option) => option.value === size)?.label ?? cargoSizes[0].label;
}

export function fallbackRoute(input: QuoteInput): RouteResult {
  return {
    source: "local",
    systems: [input.pickup?.id, input.destination?.id].filter((id): id is number => Boolean(id)),
    routeSystems: [input.pickup, input.destination].filter((system): system is NonNullable<typeof system> => Boolean(system)),
    jumps: 0,
  };
}

export function calculateQuote(input: QuoteInput, route: RouteResult): QuoteResult {
  const hasPricedRoute = Boolean(input.pickup && input.destination && route.jumps > 0);
  const base = hasPricedRoute ? 42_000_000 + route.jumps * 2_200_000 : 0;
  const volumeFee = hasPricedRoute ? input.volume * 780 : 0;
  const collateralFee = hasPricedRoute ? input.collateral * 0.012 : 0;
  const riskFee = 0;
  const estimate = base + volumeFee + collateralFee + riskFee;

  return {
    route,
    estimate,
    base,
    volumeFee,
    collateralFee,
    riskFee,
  };
}
