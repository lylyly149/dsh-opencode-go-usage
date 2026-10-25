# Changelog

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
