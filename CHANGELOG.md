# Changelog

## 1.1.1 — 2026-10-25

- Clarify the provenance and Trusted Publishing status in the documentation;
  no runtime changes.

## 1.1.0 — 2026-10-25

- Add a Loader `Config` schema for `apiKeyEnv`, `usageUrl`, and `cacheMs`, so
  the profile config is validated and editable through the Loader/Plugin
  Manager surface.
- Dates and countdowns follow the DSH UI locale instead of the browser locale;
  the tooltip and Settings page now show both an absolute reset time and a
  relative countdown.
- Show a warning indicator with the failure reason when usage is unavailable,
  instead of silently hiding the composer indicator.
- Add React error boundaries around the composer and Settings contributions.
- Reject plaintext upstream URLs for non-loopback hosts, so the bearer key is
  never sent over HTTP to a remote endpoint.
- Honour `Retry-After` for 429/5xx responses and serve the backoff window from
  the cache.
- Invalidate the Host cache when the credential reference changes.
- Pause polling while the page is hidden and refresh immediately when it
  becomes visible.
- Add jsdom/react-dom component tests for fan geometry, colors, the Settings
  page, and the unavailable state (22 tests total).
- Add `SECURITY.md`, `CONTRIBUTING.md`, Dependabot, and a provenance-ready
  npm release workflow.
- Harden the privacy test and documentation; no real account screenshots or
  local paths are published.

## 1.0.0 — 2026-10-24

- Initial public release.
- Composer indicator: three nested 270° fan arcs for the rolling 5-hour,
  weekly, and monthly OpenCode Go quota windows, with per-window green/yellow/red
  colors and the tightest window's percentage and label on the right.
- Settings page: full progress bars, used/remaining percentages, reset times,
  and a refresh action.
- Same-origin Host proxy for `https://opencode.ai/zen/go/v1/usage`; the API key
  is resolved through DSH credentials and never reaches the browser.
- English and Chinese copy, plus Plugin Manager metadata and icon.
