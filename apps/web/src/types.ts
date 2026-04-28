export type ServiceType = "Pochven" | "Thera" | "HighSec" | "LowSec" | "Zarzakh";

export type SolarSystem = {
  id: number;
  name: string;
  securityStatus: number;
  securityDisplay: string;
  regionId: number;
  regionName: string;
  constellationId: number;
  serviceType: ServiceType;
  color: string;
};

export type QuoteInput = {
  pickup: SolarSystem | null;
  destination: SolarSystem | null;
  size: CargoSize;
  speed: RunSpeed;
  volume: number;
  collateral: number;
};

export type CargoSize = "small" | "medium" | "freighter";

export type RunSpeed = "normal" | "rush";

export type QuoteValidation = {
  valid: boolean;
  allowedSizes: CargoSize[];
  selectedSizeValid: boolean;
  blockedReason: string | null;
  blockedCode: BlockedCode | null;
  maxCollateral: number;
  risk?: RouteRiskSummary | null;
};

export type BlockedCode =
  | "missing_collateral"
  | "minimum_collateral"
  | "collateral_limit"
  | "size_unavailable"
  | "risk_restricted"
  | "route_unavailable"
  | "pricing_unavailable";

export type PricingMode = "fixed" | "per_jump" | "hybrid" | "blocked";

export type QuotePricing = QuoteValidation & {
  reward: number;
  currency: "ISK";
  pricingMode: PricingMode;
  pricingLabel: string;
  routeJumps: number | null;
};

export type RouteSystem = {
  id: number;
  name: string;
  securityDisplay?: string | null;
  serviceType?: string | null;
  color?: string | null;
  shipJumpsLastHour?: number | null;
  shipKillsLastHour?: number | null;
  podKillsLastHour?: number | null;
};

export type RouteTrafficSummary = {
  totalShipJumpsLastHour: number | null;
  totalShipKillsLastHour: number | null;
  totalPodKillsLastHour: number | null;
  knownSystems: number;
  totalSystems: number;
  coverage: number;
  level: "clear" | "active" | "moderate" | "busy" | "heavy" | "unavailable";
  label: "Clear" | "Active" | "Moderate" | "Busy" | "Heavy" | "Unavailable";
};

export type RouteRiskLevel = "nominal" | "watched" | "hot" | "flashpoint" | "restricted" | "unavailable";

export type RouteRiskConfidence = "live" | "partial" | "calibrating" | "unavailable";
export type RouteRiskTrend = "stable" | "recurrent" | "volatile" | "unavailable";

export type RouteRiskSystem = {
  id: number;
  name: string;
};

export type RouteRiskSummary = {
  level: RouteRiskLevel;
  label: "Nominal" | "Watched" | "Hot" | "Flashpoint" | "Restricted" | "Unavailable";
  isBlocking: boolean;
  reason: string | null;
  affectedSystems: RouteRiskSystem[];
  lastSyncedAt: string | null;
  confidence: RouteRiskConfidence;
  trend?: RouteRiskTrend | null;
  routeStandard: "golden" | "standard";
  routeStandardLabel: "Golden Standard" | "Standard Route";
  lowSecShipKillsLastHour: number | null;
};

export type ServiceWindowLevel = "low_activity" | "medium_activity" | "high_activity";

export type ServiceWindowSummary = {
  level: ServiceWindowLevel;
  label: "Low Activity" | "Medium Activity" | "High Activity";
  detail: "Night EUTZ" | "Day EUTZ" | "Prime EUTZ";
  lastSyncedAt: string | null;
  isFresh: boolean;
  source: "schedule";
};

export type RouteResult = {
  systems: number[];
  routeSystems: RouteSystem[];
  routeTraffic?: RouteTrafficSummary | null;
  routeRisk?: RouteRiskSummary | null;
  jumps: number;
  source: "esi" | "local";
};

export type QuoteResult = {
  route: RouteResult;
  estimate: number;
  blockedReason?: string;
  blockedCode?: BlockedCode;
  currency: "ISK";
  pricingLabel: string;
  pricingMode: PricingMode;
  source: "api" | "local";
};
