import type { CargoSize, PricingMode, QuoteInput, QuotePricing, QuoteValidation, RouteResult, ServiceWindowSummary, SolarSystem } from "../types";
import { sanitizeApiText, sanitizeFiniteNumber, sanitizeHexColor, sanitizePositiveInteger, sanitizeSystemQuery } from "./guards";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8001";
const REQUEST_TIMEOUT_MS = 8_000;

type RouteResponse = {
  systems: number[];
  routeSystems: RouteResult["routeSystems"];
  routeTraffic?: RouteResult["routeTraffic"];
  routeRisk?: RouteResult["routeRisk"];
  jumps: number;
};

export type EsiStatus = {
  players: number;
  server_version: string;
  start_time: string;
  vip: boolean;
  fetched_at: string;
};

export async function fetchSystems(query: string, limit = 12): Promise<SolarSystem[]> {
  const params = new URLSearchParams({
    q: sanitizeSystemQuery(query),
    limit: String(limit),
  });
  const systems = await getJson<unknown[]>(`/api/eve/systems?${params.toString()}`);
  return systems.map((system) => normalizeSolarSystem(system));
}

export async function fetchEsiRoute(originId: number, destinationId: number): Promise<RouteResult> {
  const params = new URLSearchParams({
    originId: String(originId),
    destinationId: String(destinationId),
  });
  const route = await getJson<RouteResponse>(`/api/eve/route?${params.toString()}`);

  return {
    source: "esi",
    systems: Array.isArray(route.systems) ? route.systems.map((systemId) => sanitizePositiveInteger(systemId)) : [],
    routeSystems: Array.isArray(route.routeSystems) ? route.routeSystems.map(normalizeRouteSystem) : [],
    routeTraffic: route.routeTraffic ? {
      coverage: sanitizeFiniteNumber(route.routeTraffic.coverage),
      knownSystems: sanitizePositiveInteger(route.routeTraffic.knownSystems),
      ...normalizeRouteTrafficLevel(route.routeTraffic.level),
      totalPodKillsLastHour: route.routeTraffic.totalPodKillsLastHour === null || route.routeTraffic.totalPodKillsLastHour === undefined
        ? null
        : sanitizePositiveInteger(route.routeTraffic.totalPodKillsLastHour),
      totalShipKillsLastHour: route.routeTraffic.totalShipKillsLastHour === null || route.routeTraffic.totalShipKillsLastHour === undefined
        ? null
        : sanitizePositiveInteger(route.routeTraffic.totalShipKillsLastHour),
      totalShipJumpsLastHour: route.routeTraffic.totalShipJumpsLastHour === null
        ? null
        : sanitizePositiveInteger(route.routeTraffic.totalShipJumpsLastHour),
      totalSystems: sanitizePositiveInteger(route.routeTraffic.totalSystems),
    } : null,
    routeRisk: normalizeRouteRisk(route.routeRisk),
    jumps: sanitizePositiveInteger(route.jumps),
  };
}

export async function fetchEsiStatus(): Promise<EsiStatus> {
  return getJson<EsiStatus>("/api/eve/status");
}

export async function fetchServiceWindow(): Promise<ServiceWindowSummary> {
  const serviceWindow = await getJson<ServiceWindowSummary>("/api/solane/service-window");
  const serviceLevel = normalizeServiceWindowLevel(serviceWindow.level);
  return {
    detail: normalizeServiceWindowDetail(serviceWindow.detail),
    isFresh: Boolean(serviceWindow.isFresh),
    label: serviceLevel.label,
    lastSyncedAt: serviceWindow.lastSyncedAt,
    level: serviceLevel.level,
    source: "schedule",
  };
}

export async function validateQuote(input: QuoteInput): Promise<QuoteValidation> {
  if (!input.pickup || !input.destination) {
    throw new Error("Quote validation requires endpoints.");
  }

  const validation = await postJson<QuoteValidation>("/api/solane/quote/validate", {
    collateral: input.collateral,
    destinationSystemId: input.destination.id,
    pickupSystemId: input.pickup.id,
    size: input.size,
  });

  return normalizeQuoteValidation(validation);
}

export async function fetchQuoteCalculation(input: QuoteInput): Promise<QuotePricing> {
  if (!input.pickup || !input.destination) {
    throw new Error("Quote calculation requires endpoints.");
  }

  const pricing = await postJson<QuotePricing>("/api/solane/quote/calculate", {
    collateral: input.collateral,
    destinationSystemId: input.destination.id,
    pickupSystemId: input.pickup.id,
    size: input.size,
    speed: input.speed,
  });

  return normalizeQuotePricing(pricing);
}

async function getJson<T>(path: string): Promise<T> {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("Invalid API path.");
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    credentials: "omit",
    headers: {
      Accept: "application/json",
    },
    referrerPolicy: "no-referrer",
    signal: controller.signal,
  }).finally(() => window.clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("Unexpected API response type.");
  }

  return response.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("Invalid API path.");
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    body: JSON.stringify(body),
    cache: "no-store",
    credentials: "omit",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
    referrerPolicy: "no-referrer",
    signal: controller.signal,
  }).finally(() => window.clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("Unexpected API response type.");
  }

  return response.json() as Promise<T>;
}

function normalizeSolarSystem(value: unknown): SolarSystem {
  const system = isRecord(value) ? value : {};
  return {
    color: sanitizeHexColor(system.color),
    constellationId: sanitizePositiveInteger(system.constellationId),
    id: sanitizePositiveInteger(system.id),
    name: sanitizeApiText(system.name),
    regionId: sanitizePositiveInteger(system.regionId),
    regionName: sanitizeApiText(system.regionName),
    securityDisplay: sanitizeApiText(system.securityDisplay),
    securityStatus: sanitizeFiniteNumber(system.securityStatus),
    serviceType: normalizeServiceType(system.serviceType),
  };
}

function normalizeRouteSystem(value: unknown): RouteResult["routeSystems"][number] {
  const system = isRecord(value) ? value : {};
  return {
    color: system.color ? sanitizeHexColor(system.color) : null,
    id: sanitizePositiveInteger(system.id),
    name: sanitizeApiText(system.name),
    securityDisplay: system.securityDisplay ? sanitizeApiText(system.securityDisplay) : null,
    serviceType: system.serviceType ? sanitizeApiText(system.serviceType) : null,
    podKillsLastHour: system.podKillsLastHour === null || system.podKillsLastHour === undefined
      ? null
      : sanitizePositiveInteger(system.podKillsLastHour),
    shipKillsLastHour: system.shipKillsLastHour === null || system.shipKillsLastHour === undefined
      ? null
      : sanitizePositiveInteger(system.shipKillsLastHour),
    shipJumpsLastHour: system.shipJumpsLastHour === null || system.shipJumpsLastHour === undefined
      ? null
      : sanitizePositiveInteger(system.shipJumpsLastHour),
  };
}

function normalizeRouteTrafficLevel(value: unknown): Pick<NonNullable<RouteResult["routeTraffic"]>, "label" | "level"> {
  if (value === "clear") {
    return { label: "Clear", level: "clear" };
  }
  if (value === "active") {
    return { label: "Active", level: "active" };
  }
  if (value === "moderate") {
    return { label: "Moderate", level: "moderate" };
  }
  if (value === "busy") {
    return { label: "Busy", level: "busy" };
  }
  if (value === "heavy") {
    return { label: "Heavy", level: "heavy" };
  }
  return { label: "Unavailable", level: "unavailable" };
}

function normalizeRouteRisk(value: unknown): RouteResult["routeRisk"] {
  if (!value || !isRecord(value)) {
    return null;
  }
  const riskLevel = normalizeRouteRiskLevel(value.level);
  const affectedSystems = Array.isArray(value.affectedSystems)
    ? value.affectedSystems.map((system) => {
        const item = isRecord(system) ? system : {};
        return {
          id: sanitizePositiveInteger(item.id),
          name: sanitizeApiText(item.name),
        };
      }).filter((system) => system.id > 0 && system.name.length > 0)
    : [];

  return {
    affectedSystems,
    confidence: normalizeRouteRiskConfidence(value.confidence),
    isBlocking: Boolean(value.isBlocking),
    label: riskLevel.label,
    lastSyncedAt: typeof value.lastSyncedAt === "string" ? sanitizeApiText(value.lastSyncedAt) : null,
    level: riskLevel.level,
    lowSecShipKillsLastHour: value.lowSecShipKillsLastHour === null || value.lowSecShipKillsLastHour === undefined
      ? null
      : sanitizePositiveInteger(value.lowSecShipKillsLastHour),
    reason: typeof value.reason === "string" ? sanitizeApiText(value.reason) : null,
    routeStandard: value.routeStandard === "golden" ? "golden" : "standard",
    routeStandardLabel: value.routeStandard === "golden" ? "Golden Standard" : "Standard Route",
    trend: normalizeRouteRiskTrend(value.trend),
  };
}

function normalizeRouteRiskLevel(value: unknown): Pick<NonNullable<RouteResult["routeRisk"]>, "label" | "level"> {
  if (value === "nominal") {
    return { label: "Nominal", level: "nominal" };
  }
  if (value === "watched") {
    return { label: "Watched", level: "watched" };
  }
  if (value === "hot") {
    return { label: "Hot", level: "hot" };
  }
  if (value === "flashpoint") {
    return { label: "Flashpoint", level: "flashpoint" };
  }
  if (value === "restricted") {
    return { label: "Restricted", level: "restricted" };
  }
  return { label: "Unavailable", level: "unavailable" };
}

function normalizeRouteRiskConfidence(value: unknown): NonNullable<RouteResult["routeRisk"]>["confidence"] {
  if (value === "live" || value === "partial" || value === "calibrating" || value === "unavailable") {
    return value;
  }
  return "unavailable";
}

function normalizeRouteRiskTrend(value: unknown): NonNullable<RouteResult["routeRisk"]>["trend"] {
  if (value === "stable" || value === "recurrent" || value === "volatile" || value === "unavailable") {
    return value;
  }
  return null;
}

function normalizeServiceWindowLevel(value: unknown): Pick<ServiceWindowSummary, "label" | "level"> {
  if (value === "low_activity") {
    return { label: "Low Activity", level: "low_activity" };
  }
  if (value === "medium_activity" || value === "variable_activity") {
    return { label: "Medium Activity", level: "medium_activity" };
  }
  if (value === "high_activity") {
    return { label: "High Activity", level: "high_activity" };
  }
  return { label: "Medium Activity", level: "medium_activity" };
}

function normalizeServiceWindowDetail(value: unknown): ServiceWindowSummary["detail"] {
  if (value === "Night EUTZ" || value === "Day EUTZ" || value === "Prime EUTZ") {
    return value;
  }
  return "Day EUTZ";
}

function normalizeQuoteValidation(value: unknown): QuoteValidation {
  const validation = isRecord(value) ? value : {};
  const allowedSizes = Array.isArray(validation.allowedSizes)
    ? validation.allowedSizes.filter((size): size is CargoSize => isCargoSize(size))
    : [];

  return {
    allowedSizes,
    blockedCode: normalizeBlockedCode(validation.blockedCode),
    blockedReason: typeof validation.blockedReason === "string" ? sanitizeApiText(validation.blockedReason) : null,
    maxCollateral: sanitizePositiveInteger(validation.maxCollateral, 5_000_000_000),
    risk: normalizeRouteRisk(validation.risk),
    selectedSizeValid: Boolean(validation.selectedSizeValid),
    valid: Boolean(validation.valid),
  };
}

function normalizeQuotePricing(value: unknown): QuotePricing {
  const pricing = isRecord(value) ? value : {};
  const validation = normalizeQuoteValidation(pricing);
  const mode = normalizePricingMode(pricing.pricingMode);

  return {
    ...validation,
    currency: "ISK",
    pricingLabel: typeof pricing.pricingLabel === "string" ? sanitizeApiText(pricing.pricingLabel) : "Blocked",
    pricingMode: mode,
    reward: sanitizePositiveInteger(pricing.reward),
    routeJumps: pricing.routeJumps === null || pricing.routeJumps === undefined
      ? null
      : sanitizePositiveInteger(pricing.routeJumps),
  };
}

function normalizePricingMode(value: unknown): PricingMode {
  if (value === "fixed" || value === "per_jump" || value === "hybrid" || value === "blocked") {
    return value;
  }
  return "blocked";
}

function normalizeBlockedCode(value: unknown): QuoteValidation["blockedCode"] {
  if (
    value === "missing_collateral" ||
    value === "minimum_collateral" ||
    value === "collateral_limit" ||
    value === "size_unavailable" ||
    value === "risk_restricted" ||
    value === "route_unavailable" ||
    value === "pricing_unavailable"
  ) {
    return value;
  }
  return null;
}

function isCargoSize(value: unknown): value is CargoSize {
  return value === "small" || value === "medium" || value === "freighter";
}

function normalizeServiceType(value: unknown): SolarSystem["serviceType"] {
  return value === "Pochven" || value === "Thera" || value === "HighSec" || value === "LowSec" || value === "Zarzakh"
    ? value
    : "HighSec";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
