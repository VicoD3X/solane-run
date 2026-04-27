## Summary

- 

## Scope

- [ ] Frontend
- [ ] API contract
- [ ] Docker or infra
- [ ] GitHub or docs only

## Private Backend Guardrail

- [ ] This change does not introduce backend business logic, EVE ESI adapters, pricing formulas, private structures, saved user quotes, or account-bound flows into the public repository.
- [ ] Any backend-facing behavior is represented through `docs/api/frontend-contract.md`.

## Validation

- [ ] `npm run lint:web`
- [ ] `npm run build:web`
- [ ] `node scripts/verify-ui.mjs`
- [ ] `docker compose -f infra/docker-compose.yml config`

## Screenshots

Add desktop and mobile screenshots for visual changes.
