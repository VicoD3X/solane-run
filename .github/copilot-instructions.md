# Solane Run Repository Instructions

Solane Run is an EVE Online freight calculator frontend. Keep contributions aligned with the beta direction:

- The UI is English-only.
- This public repository contains frontend code only.
- Do not add backend business logic, EVE ESI adapters, pricing formulas, saved account data, private structures, contracts, or order workflows here.
- Integrate backend behavior only through the documented frontend API contract in `docs/api/frontend-contract.md`.
- Preserve the premium space-logistics visual system: dark interface, restrained futuristic styling, short-radius panels, fixed Solane violet UI accents, and service colors only for route/system security context.
- Frontend code lives in `apps/web` and uses React, Vite, TypeScript, Tailwind, local fonts, and lucide-react icons.
- Backend code is private and must not be introduced in this repository.
- Keep frontend Docker and Hetzner web deployment changes in `infra`.
- Run relevant checks before finishing: `npm run lint:web`, `npm run build:web`, and `node scripts/verify-ui.mjs` for UI changes when a compatible API is available.
