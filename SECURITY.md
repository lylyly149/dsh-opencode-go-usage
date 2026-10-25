# Security Policy

## Supported versions

The latest 1.x release receives security fixes. Older majors are not supported.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting for this repository:

<https://github.com/lylyly149/dsh-opencode-go-usage/security/advisories/new>

Do not open a public issue for a vulnerability, and do not include API keys,
tokens, DSH profiles, session logs, or account screenshots in a report. A
minimal reproduction with placeholder values is enough.

## Scope

Security-relevant areas of this plugin:

- The Host resolves the API key through DSH credentials and keeps it out of
  browser responses.
- The browser calls only the same-origin `/plugins/dsh-opencode-go/usage` route;
  the route rejects cross-site requests.
- Upstream URLs must be HTTPS unless they are loopback (`localhost`, `127.0.0.1`,
  `::1`), so the bearer key is never sent in plaintext to a remote host.
- Error responses contain fixed reason codes, not credentials or upstream
  response bodies.
- The plugin has no telemetry or third-party requests beyond the configured
  usage endpoint.

## Supply chain

- The npm package can be published with provenance from the GitHub Release
  workflow (`.github/workflows/release.yml`) using the npm Trusted Publisher
  bound to this repository and workflow filename.
- The release workflow uses OIDC (`id-token: write`) and does not require a
  long-lived npm token. It is manual (`workflow_dispatch`) and only publishes
  from the matching `v<package-version>` tag.
- GitHub secret scanning and push protection are enabled for this repository.
