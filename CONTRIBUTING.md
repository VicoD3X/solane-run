# Contributing

Solane Run is currently a beta-stage EVE Online freight calculator frontend. Contributions should stay focused, practical, and aligned with the public frontend / private backend split.

This repository is source-available under a proprietary All Rights Reserved license. Public visibility does not grant permission to copy, host, redistribute, or reuse the project outside approved contribution work.

## Product Rules

- The interface is English-only.
- Do not add backend business logic, EVE ESI adapters, pricing formulas, saved account data, private structures, contracts, or order workflows to this public repository.
- Integrate backend behavior only through the documented frontend API contract.
- Keep the UI useful on the first screen. This is an app surface, not a marketing landing page.
- Keep the global UI accent fixed to Solane Run violet.
- Preserve service colors only where they describe route or system security context for Pochven, Thera, HighSec, LowSec, and Zarzakh.

## Development

Install dependencies:

```powershell
npm install
```

Run locally:

```powershell
npm run dev:web
```

Set `VITE_API_BASE_URL` to a compatible Solane Run API before running route-backed workflows.

Before opening a pull request, run the relevant checks:

```powershell
npm run lint:web
npm run build:web
node scripts/verify-ui.mjs
```

For Docker-related changes:

```powershell
docker compose -f infra/docker-compose.yml config
```

## Pull Requests

Good pull requests are small, specific, and easy to verify. Include screenshots for visual changes and call out any EVE data or route behavior that changed.
