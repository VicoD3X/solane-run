export type RouteMode = "shortest" | "secure" | "insecure";

export type QuoteInput = {
  origin: string;
  destination: string;
  routeMode: RouteMode;
  volume: number;
  collateral: number;
};

export type RouteResult = {
  systems: number[];
  jumps: number;
  source: "esi" | "demo";
};

export type QuoteResult = {
  route: RouteResult;
  estimate: number;
  base: number;
  volumeFee: number;
  collateralFee: number;
  riskFee: number;
};
