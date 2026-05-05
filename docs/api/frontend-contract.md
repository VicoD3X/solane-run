# Solane Run Calculator API Contract

The public frontend is calculator-only and talks only to Solane Engine through
same-origin `/api/*` in production.

## Endpoints Used

```text
GET  /api/eve/status
GET  /api/eve/systems?q=&limit=
GET  /api/eve/route?originId=&destinationId=
GET  /api/solane/service-window
POST /api/solane/quote/validate
POST /api/solane/quote/calculate
```

The frontend must not call ESI, zKillboard or CCP web directly.

## Quote Rules

- `allowedSizes` uses `small` and `medium`.
- `small` means `13,000 m3`; `medium` means `60,000 m3`.
- Critical non-HighSec pickup/destination systems return
  `blockedCode: "risk_restricted"` and `risk.isBlocking: true`.
- Critical HighSec systems remain non-blocking for the calculator.
- Contract Review stays hidden until pickup, destination, size, speed and
  collateral are filled.

## Out Of Scope

The frontend must not render Route Intel, About, traffic flow dashboards, saved
quotes, account-bound flows, private ESI data or contract automation.
