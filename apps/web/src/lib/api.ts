import type { RouteMode, RouteResult } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type ResolveResponse = {
  systems?: { id: number; name: string }[];
  stations?: { id: number; name: string }[];
};

type RouteResponse = {
  systems: number[];
  jumps: number;
};

export type EsiStatus = {
  players: number;
  server_version: string;
  start_time: string;
  vip: boolean;
  fetched_at: string;
};

export async function fetchEsiRoute(
  origin: string,
  destination: string,
  flag: RouteMode,
): Promise<RouteResult> {
  const resolved = await postJson<ResolveResponse>("/api/eve/resolve-names", {
    names: [origin, destination],
  });

  const originId = findResolvedSystem(resolved, origin);
  const destinationId = findResolvedSystem(resolved, destination);

  if (!originId || !destinationId) {
    throw new Error("Origin or destination was not resolved by public ESI.");
  }

  const params = new URLSearchParams({
    originId: String(originId),
    destinationId: String(destinationId),
    flag,
  });
  const route = await getJson<RouteResponse>(`/api/eve/route?${params.toString()}`);

  return {
    source: "esi",
    systems: route.systems,
    jumps: route.jumps,
  };
}

export async function fetchEsiStatus(): Promise<EsiStatus> {
  return getJson<EsiStatus>("/api/eve/status");
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<T>;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<T>;
}

function findResolvedSystem(payload: ResolveResponse, name: string): number | undefined {
  const normalized = name.trim().toLowerCase();
  return payload.systems?.find((system) => system.name.toLowerCase() === normalized)?.id;
}
