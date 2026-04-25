# Solane Run

Solane Run is a premium EVE Online freight calculator foundation. This repository starts with a separate React frontend, a FastAPI backend, public-only ESI integration, and Docker scaffolding ready for a future Hetzner VPS deployment.

## Project Layout

- `apps/web` - React, Vite, TypeScript, Tailwind UI.
- `apps/api` - FastAPI, Pydantic, async httpx ESI client.
- `infra` - Docker Compose for local service orchestration.
- `logo` - Source Solane Run brand assets.

## Local Development

Install frontend dependencies:

```powershell
npm install
```

Install backend dependencies:

```powershell
py -m pip install -r apps/api/requirements-dev.txt
```

Run the API:

```powershell
npm run dev:api
```

Run the web app:

```powershell
npm run dev:web
```

## Verification

```powershell
npm run lint:web
npm run build:web
npm run test:api
docker compose -f infra/docker-compose.yml config
```

## ESI Scope

This foundation intentionally uses public ESI only: universe names, universe IDs, stations, systems, and route calculation. EVE SSO and private structure reads are out of scope for this phase.
