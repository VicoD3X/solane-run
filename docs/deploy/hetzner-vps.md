# Hetzner VPS Deployment Notes

Solane Run is deployed as a classic website: the calculator is the main public page, and `/api/*` is proxied to the private Solane Run API.

## Target

- VPS: Hetzner CPX32 Debian, `clartai-prod-01`
- Domain: `solane-run.app`
- IPv4: `178.104.165.186`
- Public edge: existing Caddy on the VPS
- Frontend container: `solane-web` on the shared Docker network `solane-run`

## DNS

Create these records in Spaceship:

```text
A     @      178.104.165.186
A     www    178.104.165.186
AAAA  @      <exact host IPv6 from Debian>
AAAA  www    <exact host IPv6 from Debian>
```

Do not use the Hetzner `/64` range directly as the `AAAA` value. Confirm the exact host address on Debian:

```bash
ip -6 addr show scope global
```

## Server Shape

Use one shared Solane directory:

```text
/srv/solane-run
|-- backups
|-- cache
|-- releases
|-- repo
|   |-- api
|   `-- web
`-- shared
    `-- solane-run.env
```

The frontend repository is expected under:

```text
/srv/solane-run/repo/web
```

## Docker Network

Create the shared network once:

```bash
docker network create solane-run
```

The frontend compose joins that network with the alias `solane-web`. The API compose joins the same network with the alias `solane-api`.

## Caddy Integration

Do not start a second public reverse proxy on ports `80` and `443`. Add the Solane snippet to the existing Caddy edge config:

```text
solane-run.app, www.solane-run.app {
	encode zstd gzip
	reverse_proxy solane-web:80
}
```

The complete snippet is available in `infra/caddy/Caddyfile.solane-run`.

The existing Caddy container must be connected to the `solane-run` Docker network so it can resolve `solane-web`.

## Release ZIP

Create the local release archive:

```powershell
npm run export:zip
```

The archive is written to:

```text
D:\PROJECT\DEPLOY\Solane Run.zip
```

Upload it later to:

```text
/srv/solane-run/releases/Solane Run.zip
```

The ZIP excludes local env files, Git metadata, dependencies, build output, logs, and caches.
