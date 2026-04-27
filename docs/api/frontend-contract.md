# Solane Run Frontend API Contract

This public repository contains the Solane Run web frontend only. The backend, EVE ESI adapters, pricing rules, internal caches, and operational workflows are private.

The frontend talks to the private API through:

```text
VITE_API_BASE_URL=https://api.example.local
```

All examples below are frontend-facing contracts, not backend implementation guidance.

## Principles

- Keep this contract stable for the public source-available frontend.
- Do not expose internal pricing formulas, route policy internals, ESI credentials, private ESI scopes, or operational rules.
- Return enough data for the UI to render a useful calculator and route reconnaissance surface.
- Prefer additive changes. Removing fields should be treated as a breaking change.
- All UI strings remain English.

## Health

```http
GET /health
```

Expected shape:

```json
{
  "status": "ok",
  "service": "solane-run-api"
}
```

## Tranquility Status

```http
GET /api/eve/status
```

Expected shape:

```json
{
  "players": 18440,
  "server_version": "2938421",
  "start_time": "2026-04-27T11:00:00Z",
  "vip": false,
  "fetched_at": "2026-04-27T07:45:00Z"
}
```

## System Search

```http
GET /api/eve/systems?q=Jita&limit=12
```

The private API owns catalog construction and filtering. The current frontend expects selectable systems to include HighSec, LowSec, Pochven, Thera, and Zarzakh according to Solane Run service rules.

Expected item shape:

```json
{
  "id": 30000142,
  "name": "Jita",
  "securityStatus": 0.9,
  "securityDisplay": "0.9",
  "regionId": 10000002,
  "regionName": "The Forge",
  "constellationId": 20000020,
  "serviceType": "HighSec",
  "color": "#6FCF97"
}
```

## Route

```http
GET /api/eve/route?originId=30000142&destinationId=30002187
```

The private API owns route policy, ESI calls, caching, fallback behavior, and future internal route intelligence.

Expected shape:

```json
{
  "origin_id": 30000142,
  "destination_id": 30002187,
  "flag": "secure",
  "systems": [30000142, 30000144, 30002187],
  "routeSystems": [
    {
      "id": 30000142,
      "name": "Jita",
      "securityDisplay": "0.9",
      "serviceType": "HighSec",
      "color": "#6FCF97",
      "shipJumpsLastHour": 1712
    }
  ],
  "jumps": 2
}
```

`shipJumpsLastHour` may be `null` when traffic data is unavailable. The frontend will render `Traffic unavailable` without blocking the route display.

## Future Private Endpoints

The following surfaces are expected to move behind private Solane Run endpoints over time:

- quote pricing and reward calculation
- service availability and operational status
- route risk intelligence
- internal contract templates
- future account or order workflows

When those endpoints are introduced, document only the frontend request/response contract here. Do not publish backend formulas or implementation details.
