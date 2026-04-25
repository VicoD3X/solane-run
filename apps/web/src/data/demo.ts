import type { QuoteInput, QuoteResult, RouteMode, RouteResult } from "../types";

export const commonSystems = [
  { name: "Jita", id: 30000142, region: "The Forge", security: "0.9" },
  { name: "Amarr", id: 30002187, region: "Domain", security: "1.0" },
  { name: "Dodixie", id: 30002659, region: "Sinq Laison", security: "0.9" },
  { name: "Rens", id: 30002510, region: "Heimatar", security: "0.9" },
  { name: "Hek", id: 30002053, region: "Metropolis", security: "0.5" },
];

const fallbackJumps: Record<RouteMode, number> = {
  shortest: 12,
  secure: 16,
  insecure: 8,
};

export function fallbackRoute(input: QuoteInput): RouteResult {
  const originId = findKnownSystemId(input.origin) ?? commonSystems[0].id;
  const destinationId = findKnownSystemId(input.destination) ?? commonSystems[1].id;
  return {
    source: "demo",
    systems: [originId, destinationId],
    jumps: fallbackJumps[input.routeMode],
  };
}

export function calculateQuote(input: QuoteInput, route: RouteResult): QuoteResult {
  const riskMultiplier = input.routeMode === "secure" ? 0.82 : input.routeMode === "insecure" ? 1.34 : 1;
  const base = 42_000_000 + route.jumps * 2_200_000;
  const volumeFee = input.volume * 780;
  const collateralFee = input.collateral * 0.012;
  const riskFee = (base + volumeFee) * (riskMultiplier - 1);
  const estimate = Math.max(0, base + volumeFee + collateralFee + riskFee);

  return {
    route,
    estimate,
    base,
    volumeFee,
    collateralFee,
    riskFee,
  };
}

export function findKnownSystemId(name: string): number | undefined {
  const normalized = name.trim().toLowerCase();
  return commonSystems.find((system) => system.name.toLowerCase() === normalized)?.id;
}
