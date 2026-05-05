# Solane Run VPS Deployment

The public site is the calculator only. Route Intel and About are not part of
the deployed frontend.

## Production Behavior

```text
https://solane-run.app/       -> Solane Run calculator
https://solane-run.app/api/*  -> nginx proxy to solane-api:8000
```

## Runtime Shape

- `solane-api`: FastAPI Solane Engine container.
- `solane-web`: nginx container serving the React build and proxying `/api/*`.
- `solane-run-edge-caddy-1`: public Caddy edge proxying to `solane-web`.
- Docker network: `solane-run`.

## Deploy

```powershell
powershell -ExecutionPolicy Bypass -File scripts\deploy-vps.ps1
```

The script:

- refuses dirty Git state by default;
- runs frontend and API checks unless `-SkipChecks` is used;
- archives the current Git commits;
- rebuilds and restarts Engine before the web container;
- refreshes the Caddy edge config;
- verifies API health, `/api/eve/status`, local web health and the public root.

Use `-AllowDirty` only for emergency experiments that should not become the
normal release path.
