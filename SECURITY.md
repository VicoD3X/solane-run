# Security Policy

Solane Run is a public calculator frontend. It must not contain runtime secrets,
EVE SSO credentials, Discord tokens, private ESI refresh tokens or operator
keys.

Allowed frontend responsibilities:

- collect freight parameters;
- call Solane Engine through same-origin `/api/*`;
- display quote, route jumps and display-safe guardrails.

Forbidden frontend responsibilities:

- duplicate pricing formulas or route-risk logic;
- expose private ESI, contracts, wallet or operator data;
- reintroduce Route Intel, About, saved quotes or contract automation surfaces;
- call ESI, zKillboard or CCP web directly.

Production security headers are enforced by the nginx web container and the
Caddy edge. To report a vulnerability, use a private GitHub security advisory
or contact Victor A. through GitHub.
