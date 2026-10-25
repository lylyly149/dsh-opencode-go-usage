# OpenCode Go Usage

[![npm version](https://img.shields.io/npm/v/@lylyly149/dsh-opencode-go-usage.svg)](https://www.npmjs.com/package/@lylyly149/dsh-opencode-go-usage)
[![license](https://img.shields.io/npm/l/@lylyly149/dsh-opencode-go-usage.svg)](LICENSE)
[![CI](https://github.com/lylyly149/dsh-opencode-go-usage/actions/workflows/ci.yml/badge.svg)](https://github.com/lylyly149/dsh-opencode-go-usage/actions/workflows/ci.yml)

OpenCode Go plan quota for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness):
a compact **270° fan** beside the composer and a dedicated **Settings → OpenCode Go**
page for the rolling 5-hour, weekly, and monthly windows.

![270° fan indicator preview](https://raw.githubusercontent.com/lylyly149/dsh-opencode-go-usage/main/docs/fan.png)

The preview uses illustrative values (75%, 35%, 10%) to show arc lengths and
colors; live values come from the official usage endpoint.

## Features

- **Composer indicator** — three nested fan arcs beside the model seat while the
  current Session uses the `opencode-go` provider. From outside in: rolling
  5-hour, weekly, monthly. Each ring keeps 270° of its circle (the bottom 90° is
  cut away) and fills clockwise by remaining budget.
- **Color by remaining** — each arc and the number use green at ≥50% remaining,
  yellow at 20–49%, and red below 20%.
- **Tightest window label** — the number on the right is the window with the
  least remaining budget plus its short label, such as `84%（月）` or
  `84% (month)`.
- **Settings page** — full progress bars, used/remaining percentages, reset
  times, and a refresh button. Available regardless of the selected model.
- **Unavailable state** — when the key is missing, rejected, or the
  subscription is inactive, the composer shows a small warning marker with the
  reason instead of silently disappearing.
- **Locale-aware dates** — reset times and the relative countdown follow the
  DSH UI locale, not the browser/OS locale. Chinese stays Chinese and English
  stays English.
- **English and Chinese** — UI copy and Plugin Manager metadata in both
  languages.
- **Live updates** — the browser polls every 60 seconds; the Host caches the
  upstream response for 30 seconds. Polling pauses while the tab is hidden and
  refreshes immediately when it becomes visible. Arc lengths and colors
  transition smoothly.
- **Resilient Host** — honours `Retry-After` for 429/5xx responses, invalidates
  the cache when the credential reference changes, and rejects plaintext
  upstream URLs for non-loopback hosts.

## Requirements

- DeepSeek Harness `0.2.1-rc.1` or newer (`engines.dsh`).
- Node.js 18 or newer on the Host.
- An OpenCode Go subscription and its API key.

Tested against DSH `0.2.1-rc.3` with the `desktop` profile. The plugin only uses
public Cordis services (`webServer`, `credentials`) and the client slot,
locale, and model-directory APIs.

## Install

### 1. Install the package

From the DSH CLI:

```bash
dsh plugin --profile <profile> add @lylyly149/dsh-opencode-go-usage
```

Or from the Desktop app: **Plugins → Add plugin**, then enter
`@lylyly149/dsh-opencode-go-usage`.

For a local checkout:

```bash
dsh plugin --profile <profile> add /absolute/path/to/dsh-opencode-go-usage
```

`<profile>` is usually `desktop` for the Desktop app or `web` for a `dsh web`
profile. The CLI reconciles the package's `dsh.bundle.patch` automatically.

### 2. Store the API key

Add the key to `~/.dsh/.credentials.yaml` under a credential reference:

```yaml
refs:
  OPENCODE_GO_API_KEY: <your OpenCode Go API key>
```

Or store it through **Settings → Models** for the `opencode-go` provider.

Set `apiKeyEnv` in the plugin row if your provider uses a different reference:

```yaml
- id: opencode-go-usage
  config:
    apiKeyEnv: MY_OPENCODE_REF
```

The plugin tries `apiKeyEnv` first, then `OPENCODE_API_KEY` as a fallback.

### 3. Reload

Restart `dsh web` (or the Desktop app) and refresh the page once. The plugin's
composer indicator appears when the current Session's provider is
`opencode-go`; the Settings page is always available.

## Configuration

The Host exports a Loader `Config` schema, so these fields are validated at
activation and are available to the Plugin Manager/Loader configuration surface. They
can also be set in the profile's `cordis.patch.yml`:

| Field | Default | Meaning |
|---|---|---|
| `apiKeyEnv` | `OPENCODE_GO_API_KEY` | Credential reference resolved through `ctx.credentials`; `OPENCODE_API_KEY` is tried as a fallback |
| `usageUrl` | `https://opencode.ai/zen/go/v1/usage` | Upstream quota endpoint; must be HTTPS unless it is a loopback host |
| `cacheMs` | `30000` | Host-side upstream cache lifetime (5s–300s) |

Example:

```yaml
- id: opencode-go-usage
  config:
    apiKeyEnv: OPENCODE_GO_API_KEY
    cacheMs: 30000
```

## How it works

| Half | Role |
|---|---|
| Host (`index.js`) | Registers `GET /plugins/dsh-opencode-go/usage`, resolves the key through `ctx.credentials`, calls the official endpoint, normalizes the three windows, and caches for 30 seconds. |
| Browser (`client.js`) | Hand-authored `window.__ModuleLoader__.load` bundle. Registers the composer indicator and the Settings section; polls the same-origin route every 60 seconds. |

The upstream payload is:

```json
{
  "usage": {
    "rolling": { "status": "ok", "percent": 0, "resetsAt": "..." },
    "weekly": { "status": "ok", "percent": 2, "resetsAt": "..." },
    "monthly": { "status": "ok", "percent": 16, "resetsAt": "..." }
  }
}
```

`percent` is budget **used**; the UI renders remaining budget. A
`status: "rate-limited"` window renders as 0% remaining and is labeled
“Rate limited” on the Settings page.

## Security and privacy

- The API key never reaches the browser. Only the Host resolves it and calls
  the upstream endpoint.
- The browser calls a same-origin route; the route rejects cross-site requests
  and sends `cache-control: no-store`.
- Error responses contain fixed reason codes, never credentials or upstream
  response bodies.
- The plugin has no telemetry, analytics, or third-party requests beyond the
  official quota endpoint. It stores no account data; the Host cache is
  in-memory only.
- Upstream URLs must be HTTPS unless they are loopback hosts, so the bearer key
  is never sent in plaintext to a remote endpoint.
- This repository contains no API keys, DSH profiles, session logs, or user
  paths. The preview image uses synthetic values.
- npm releases carry provenance from the GitHub release workflow; configure npm
  Trusted Publishing for this repository to avoid long-lived npm tokens. See
  [SECURITY.md](SECURITY.md).

## Failure behavior

- Missing/invalid key or no Go subscription: the Settings page explains the
  condition, and the composer shows a small warning marker with the reason.
- Transient network or upstream failure: the last successful quota stays on
  screen until a later poll succeeds.
- 429/5xx: the Host honours `Retry-After` (up to one hour), serves the backoff
  window from its cache, and reports `rate-limited` or `server-error`.
- The Settings page's **Refresh** action bypasses the Host cache.

## Compatibility and relationship to other plugins

There is an independent npm package named `dsh-opencode-go-usage` (by `yumusb`)
that also shows OpenCode Go usage. It is a different MIT project with a sidebar
widget, a `/opencode-go` command, and a session-header helper. This package is
not a fork: it focuses on the **composer 270° fan** and the **Settings page**.
The two packages use different routes and can coexist, but installing both will
show two independent quota surfaces; installing one is usually enough.

## Development

One small runtime dependency (`@deepseek-ai/schemastery` for the Loader
`Config`), development-only browser test dependencies, and no build step.

```bash
npm install
npm test          # 22 tests: Host route, real client components in jsdom, manifest/privacy
npm pack --dry-run
```

The test suite includes jsdom/react-dom component tests for the 270° fan
geometry, colors, the Settings page, and the unavailable state. CI runs the
suite on Node 20 and 22 and checks the published file list.

The browser half is a hand-authored factory bundle because out-of-tree client
plugins have no public build pipeline yet. It may only `require()` modules from
the shell module table (`react` and registered client packages). See the
[DSH Cordis plugin guide](https://github.com/deepseek-ai/deepseek-harness) for
the Loader patch dialect and slot rules.

## License

MIT. See [LICENSE](LICENSE).
